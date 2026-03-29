import React from 'react';
import ShopFeed from './ProductFeed/ShopFeed.jsx';   
import GuestFeed from './ProductFeed/GuestFeed.jsx'; 

export default function ProductFeed(props) {
  const hasShop = props.user && props.user.primaryShop;

  if (hasShop) {
    return <ShopFeed {...props} />;
  }

  return <GuestFeed {...props} />;
}
