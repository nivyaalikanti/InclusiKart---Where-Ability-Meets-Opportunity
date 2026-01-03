import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingItem = state.items.find(
        item => item.product._id === action.payload.product._id
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.product._id === action.payload.product._id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      }

      return {
        ...state,
        items: [...state.items, action.payload]
      };

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.product._id !== action.payload)
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.product._id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };

    case 'CLEAR_CART':
      return {
        items: [],
        total: 0
      };

    case 'LOAD_CART':
      return action.payload;

    default:
      return state;
  }
};

const calculateTotal = (items) => {
  return items.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('inclusikart_cart');
    if (savedCart) {
      dispatch({ type: 'LOAD_CART', payload: JSON.parse(savedCart) });
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    const cartWithTotal = {
      ...state,
      total: calculateTotal(state.items)
    };
    localStorage.setItem('inclusikart_cart', JSON.stringify(cartWithTotal));
  }, [state.items]);

  // Add logging to see what's in cart
const addToCart = (product, quantity = 1) => {
  console.log('Adding to cart:', product._id, quantity);
  dispatch({
    type: 'ADD_TO_CART',
    payload: { product, quantity }
  });
};

// Also log when removing
const removeFromCart = (productId) => {
  console.log('Removing from cart:', productId);
  dispatch({
    type: 'REMOVE_FROM_CART',
    payload: productId
  });
};

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { productId, quantity }
    });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getCartItemsCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return calculateTotal(state.items);
  };

  const value = {
    cartItems: state.items,
    cartTotal: getCartTotal(),
    cartItemsCount: getCartItemsCount(),
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};