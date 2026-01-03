// smsService.js
// Trial-safe Twilio SMS helper with dynamic verified number checking

const twilio = (() => {
  try {
    return require("twilio");
  } catch {
    return null;
  }
})();

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

// ✅ Use ONLY a Twilio phone number (US number works on trial)
const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || "+19529526931";

const client =
  twilio && ACCOUNT_SID && AUTH_TOKEN
    ? twilio(ACCOUNT_SID, AUTH_TOKEN)
    : null;

// ✅ TRIAL ACCOUNT MESSAGE LIMIT: Max 160 characters per segment
const TRIAL_MAX_LENGTH = 140; // Safe margin below 160

// Cache for verified numbers (refresh every 5 minutes)
let verifiedNumbersCache = {
  numbers: [],
  lastUpdated: 0,
  cacheDuration: 5 * 60 * 1000 // 5 minutes
};

/**
 * Normalize phone number to E.164 (India-focused)
 */
function normalizePhone(input) {
  if (!input) return null;

  let raw = String(input).trim();
  raw = raw.replace(/\s+/g, '');

  if (raw.startsWith('+')) {
    raw = '+' + raw.slice(1).replace(/\D/g, '');
  } else {
    raw = raw.replace(/\D/g, '');
  }

  // India rules
  if (raw.startsWith('+91') && raw.length === 13) return raw;
  if (raw.length === 10) return '+91' + raw;
  if (raw.length === 12 && raw.startsWith('91')) return '+' + raw;
  if (raw.startsWith('+') && raw.length > 13) return raw;

  console.warn("⚠️ Could not normalize phone:", input, "=>", raw);
  return raw;
}

/**
 * Fetch ALL verified numbers from Twilio account
 */
async function fetchVerifiedNumbers() {
  if (!client) {
    console.warn("⚠️ Twilio client not configured");
    return [];
  }

  // Check cache first
  const now = Date.now();
  if (verifiedNumbersCache.numbers.length > 0 && 
      now - verifiedNumbersCache.lastUpdated < verifiedNumbersCache.cacheDuration) {
    console.log("📋 Using cached verified numbers");
    return verifiedNumbersCache.numbers;
  }

  try {
    console.log("🔄 Fetching verified numbers from Twilio...");
    
    // Fetch verified caller IDs
    const verifiedCallerIds = await client.outgoingCallerIds.list({ limit: 100 });
    
    // Also fetch active Twilio phone numbers (they're automatically verified)
    const incomingNumbers = await client.incomingPhoneNumbers.list({ limit: 100 });
    
    const allVerified = [
      // Verified caller IDs
      ...verifiedCallerIds.map(item => item.phoneNumber),
      // Your Twilio numbers (they're automatically verified)
      ...incomingNumbers.map(item => item.phoneNumber)
    ];
    
    // Normalize all numbers
    const normalizedNumbers = allVerified
      .map(num => normalizePhone(num))
      .filter(num => num !== null);
    
    // Remove duplicates
    const uniqueNumbers = [...new Set(normalizedNumbers)];
    
    // Update cache
    verifiedNumbersCache = {
      numbers: uniqueNumbers,
      lastUpdated: now,
      cacheDuration: 5 * 60 * 1000
    };
    
    console.log(`✅ Found ${uniqueNumbers.length} verified numbers`);
    if (uniqueNumbers.length > 0) {
      console.log("   Verified:", uniqueNumbers.join(", "));
    }
    
    return uniqueNumbers;
    
  } catch (error) {
    console.error("❌ Failed to fetch verified numbers:", error.message);
    // Return cached numbers if available, even if stale
    return verifiedNumbersCache.numbers.length > 0 ? verifiedNumbersCache.numbers : [];
  }
}

/**
 * Check if a number is verified in Twilio account
 */
async function isNumberVerified(phoneNumber) {
  const normalized = normalizePhone(phoneNumber);
  if (!normalized) return false;
  
  const verifiedNumbers = await fetchVerifiedNumbers();
  return verifiedNumbers.includes(normalized);
}

/**
 * Truncate message for trial account limits
 */
function truncateForTrial(body) {
  if (!body) return "Welcome to Inclusikart!";
  
  // Remove or replace emojis (they use more characters)
  let cleanBody = body.replace(/[^\x00-\x7F]/g, '');
  
  // If still too long, truncate
  if (cleanBody.length > TRIAL_MAX_LENGTH) {
    cleanBody = cleanBody.substring(0, TRIAL_MAX_LENGTH - 3) + '...';
  }
  
  return cleanBody;
}

/**
 * Send SMS (Trial-safe with dynamic verification check)
 */
async function sendSms(to, body, isTrial = true) {
  if (!to) throw new Error("Recipient phone number is required");

  const toNormalized = normalizePhone(to);
  console.log("📱 SMS Request:");
  console.log("  Raw input:", to);
  console.log("  Normalized:", toNormalized);

  // ✅ Handle trial account message length restriction
  let finalMessage;
  if (isTrial) {
    finalMessage = truncateForTrial(body);
    console.log("  Trial Mode: ON");
    console.log("  Original length:", body?.length || 0);
    console.log("  Final length:", finalMessage.length);
    
    if (finalMessage.length > TRIAL_MAX_LENGTH) {
      console.error(`❌ Message too long for trial: ${finalMessage.length} > ${TRIAL_MAX_LENGTH}`);
      return null;
    }
  } else {
    finalMessage = body || "Welcome to Inclusikart!";
  }

  if (!client) {
    console.log("❌ Twilio not configured. SMS not sent →", toNormalized);
    return null;
  }

  // ✅ DYNAMIC Trial account verification check
  if (isTrial) {
    const isVerified = await isNumberVerified(toNormalized);
    
    if (!isVerified) {
      const verifiedNumbers = await fetchVerifiedNumbers();
      console.error(
        "🚫 TRIAL RESTRICTION:",
        toNormalized,
        "is not verified in Twilio account"
      );
      console.log("📋 Currently verified numbers:", verifiedNumbers);
      console.log("💡 To fix: Add this number in Twilio Console → Verified Caller IDs");
      return null;
    }
  }

  try {
    console.log("📤 Sending SMS via Twilio...");
    console.log("  Message:", finalMessage);
    
    const msg = await client.messages.create({
      body: finalMessage,
      from: FROM_NUMBER,
      to: toNormalized,
    });
    
    console.log("✅ Twilio SMS queued successfully!");
    console.log("  SID:", msg.sid);
    console.log("  Status:", msg.status);
    console.log("  To:", msg.to);
    console.log("  From:", msg.from);
    console.log("  Message length:", finalMessage.length);

    // 🔎 Check final delivery status after 10 seconds
    setTimeout(async () => {
      try {
        const fetched = await client.messages(msg.sid).fetch();
        console.log(
          `📊 Final status for ${msg.sid}:`,
          fetched.status,
          "Error Code:",
          fetched.errorCode || "None"
        );
        
        if (fetched.errorCode) {
          console.log("  Error Message:", fetched.errorMessage);
        }
      } catch (err) {
        console.error("❌ Status fetch failed:", err.message);
      }
    }, 10_000);

    return msg;

  } catch (err) {
    console.error(
      "❌ Twilio send failed:",
      err.message,
      "Error Code:",
      err.code || "Unknown"
    );
    
    if (err.code === 30044) {
      console.log("💡 30044 Error: Message too long for trial account");
    }
    
    return null;
  }
}

/**
 * Send welcome SMS for new user registration
 */
async function sendWelcomeSms(phone, username, role = "user") {
  const welcomeMessages = {
    seller: `Hi ${username}! Welcome to Inclusikart as a seller.`,
    buyer: `Hi ${username}! Welcome to Inclusikart.`,
    default: `Welcome to Inclusikart, ${username}!`
  };
  
  const message = welcomeMessages[role] || welcomeMessages.default;
  return await sendSms(phone, message, true);
}

/**
 * Add a new number to verified list (helper function)
 */
async function verifyNewNumber(phoneNumber) {
  const normalized = normalizePhone(phoneNumber);
  console.log(`📞 Attempting to verify: ${normalized}`);
  
  try {
    // This starts the verification process
    const verification = await client.validationRequests.create({
      phoneNumber: normalized,
      friendlyName: `User-${Date.now()}`
    });
    
    console.log(`✅ Verification initiated for: ${normalized}`);
    console.log(`   Call/SMS this number to get verification code`);
    console.log(`   Then enter code in Twilio Console`);
    
    return {
      success: true,
      phoneNumber: normalized,
      status: 'pending',
      message: 'Check phone for verification code'
    };
  } catch (error) {
    console.error(`❌ Failed to verify ${normalized}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test SMS with dynamic verification
 */
async function testSmsSystem() {
  console.log("🚀 Testing SMS System with Dynamic Verification...\n");
  
  // First, fetch all verified numbers
  const verifiedNumbers = await fetchVerifiedNumbers();
  console.log(`📋 Total verified numbers: ${verifiedNumbers.length}`);
  
  if (verifiedNumbers.length === 0) {
    console.log("❌ No verified numbers found. Add some in Twilio Console first.");
    return;
  }
  
  // Test with first verified number
  console.log("\n1. Testing with first verified number:");
  await sendSms(verifiedNumbers[0], "Test message to verified number", true);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test with a potentially unverified number
  console.log("\n2. Testing with unverified number (should fail):");
  await sendSms("+911234567890", "This should fail - not verified", true);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test welcome message
  console.log("\n3. Testing welcome SMS:");
  await sendWelcomeSms(verifiedNumbers[0], "TestUser", "seller");
}

/**
 * Quick utility to list all verified numbers
 */
async function listVerifiedNumbers() {
  const numbers = await fetchVerifiedNumbers();
  console.log("\n📋 VERIFIED NUMBERS IN YOUR ACCOUNT:");
  if (numbers.length === 0) {
    console.log("   No verified numbers found.");
    console.log("   Add numbers in: Twilio Console → Phone Numbers → Verified Caller IDs");
  } else {
    numbers.forEach((num, index) => {
      console.log(`   ${index + 1}. ${num}`);
    });
  }
  return numbers;
}

module.exports = { 
  sendSms, 
  normalizePhone, 
  sendWelcomeSms,
  truncateForTrial,
  fetchVerifiedNumbers,
  isNumberVerified,
  verifyNewNumber,
  listVerifiedNumbers,
  TRIAL_MAX_LENGTH 
};

// ----------------------
// MAIN EXECUTION
// ----------------------
if (require.main === module) {
  console.log("📱 Inclusikart SMS Service - Dynamic Verification\n");
  
  // Show verified numbers first
  listVerifiedNumbers().then(async () => {
    // Then run tests
    await testSmsSystem();
    
    console.log("\n✅ System ready!");
    console.log("\n💡 Usage Tips:");
    console.log("   1. To see verified numbers: await listVerifiedNumbers()");
    console.log("   2. To check a number: await isNumberVerified('+91XXXXXX')");
    console.log("   3. To verify new: await verifyNewNumber('+91XXXXXX')");
    console.log("   4. All verified numbers work automatically!");
  });
}