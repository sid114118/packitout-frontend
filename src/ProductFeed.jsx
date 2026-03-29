import React from 'react';
// 👇 Notice these exact lowercase filenames with .jsx!
import ShopFeed from './shop.jsx';   
import GuestFeed from './guest.jsx'; 

export default function ProductFeed(props) {
  // If the user is logged in AND has a primary shop selected
  const hasShop = props.user && props.user.primaryShop;

  if (hasShop) {
    return <ShopFeed {...props} />;
  }

  // Otherwise, route them to the Guest Feed
  return <GuestFeed {...props} />;
}
