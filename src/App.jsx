  // ➕ Function to add items to cart
  const handleAddToCart = (product) => {
    
    // 🛑 THE SECURITY CHECK: Are they logged in?
    if (!loggedInUser) {
      alert("Please log in or sign up to add items to your cart! 🛒");
      window.location.hash = "#account"; // Instantly teleports them to the login screen!
      return; // Stops the function so the item DOES NOT go into the cart
    }

    // ✅ If they ARE logged in, proceed as normal!
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        return prevCart.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item);
      } else {
        return [...prevCart, { ...product, qty: 1 }];
      }
    });
  };
