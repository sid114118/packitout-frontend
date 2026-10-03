import React from 'react';
import ShopFeed from './ProductFeed/ShopFeed.jsx';   
import GuestFeed from './ProductFeed/GuestFeed.jsx'; 

export default function ProductFeed({ guestShopId, ...props }) {
  const hasShop = (props.user && props.user.primaryShop) || guestShopId;

  if (hasShop) {
    const feedProps = props.user 
      ? props 
      : { ...props, user: { primaryShop: guestShopId } };
    return <ShopFeed {...feedProps} />;
  }

  return <GuestFeed {...props} />;
}
