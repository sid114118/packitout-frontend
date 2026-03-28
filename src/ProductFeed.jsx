import React from 'react';
import ShopFeed from './ShopFeed';
import GuestFeed from './GuestFeed';

export default function ProductFeed(props) {
  // If the user is logged in AND has a primary shop selected
  const hasShop = props.user && props.user.primaryShop;

  if (hasShop) {
    return <ShopFeed {...props} />;
  }

  // Otherwise, route them to the beautifully populated Guest Feed
  return <GuestFeed {...props} />;
}
