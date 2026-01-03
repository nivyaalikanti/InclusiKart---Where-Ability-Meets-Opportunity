import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Grid,
  Chip,
  Divider,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  Category as CategoryIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const SellerInfoCard = ({ seller, stats }) => {
  if (!seller) return null;

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Seller Information
        </Typography>
        
        {/* Seller Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={seller.profileImage}
            sx={{ width: 64, height: 64, mr: 2 }}
          >
            <PersonIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h6">
              {seller.businessName || seller.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Member since {format(new Date(seller.createdAt), 'MMM yyyy')}
            </Typography>
            {seller.bio && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {seller.bio}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Contact Information */}
        <Typography variant="subtitle1" gutterBottom>
          Contact Information
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body2">{seller.email}</Typography>
            </Box>
          </Grid>
          {seller.phone && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2">{seller.phone}</Typography>
              </Box>
            </Grid>
          )}
          {seller.address && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <LocationIcon sx={{ mr: 1, color: 'primary.main', mt: 0.5 }} />
                <Typography variant="body2">
                  {seller.address.street}, {seller.address.city}, {seller.address.state} - {seller.address.pincode}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Business Statistics */}
        {stats && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Business Statistics
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                  <InventoryIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h6">{stats.totalProducts}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Products
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                  <MoneyIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h6">
                    ₹{stats.totalSales.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Sales
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                  <CartIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h6">{stats.totalOrders}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Orders
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                  <CalendarIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="body2">
                    {format(new Date(stats.memberSince), 'MMM yyyy')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Member Since
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </>
        )}

        {/* Product Categories */}
        {stats?.productCategories?.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Top Product Categories
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              {stats.productCategories.map((cat, index) => (
                <Chip
                  key={index}
                  label={`${cat._id} (${cat.count})`}
                  size="small"
                  icon={<CategoryIcon />}
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </>
        )}

        {/* Recent Products */}
        {seller.products?.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Recent Products
            </Typography>
            <Grid container spacing={1}>
              {seller.products.slice(0, 4).map((product, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <Card variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                    {product.images?.[0] ? (
                      <Box
                        component="img"
                        src={product.images[0]}
                        alt={product.name}
                        sx={{
                          width: '100%',
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: 0.5,
                          mb: 1
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: 60,
                          bgcolor: 'grey.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1
                        }}
                      >
                        <InventoryIcon />
                      </Box>
                    )}
                    <Typography variant="caption" noWrap>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      ₹{product.price}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SellerInfoCard;