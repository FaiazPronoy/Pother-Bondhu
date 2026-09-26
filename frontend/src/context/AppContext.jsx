import React, { useState, useEffect, useRef, createContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl as configBackendUrl } from "../config";
import { useLang } from "./LangContext";

export const AppContext = createContext();

const readLocalCart = () => {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
};

export const AppContextProvider = (props) => {
  const backendUrl = configBackendUrl;
  const { t } = useLang();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [cart, setCart] = useState(readLocalCart);
  const [authChecked, setAuthChecked] = useState(false);

  const [productData, setProductData] = useState([]);
  const [productLoading, setProductLoading] = useState(true);

  // true once the saved cart has been fetched after sign in, so the first
  // render does not overwrite the saved one with an empty list
  const cartSynced = useRef(false);

  axios.defaults.withCredentials = true;

  const checkAuthStatus = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/auth/status`);
      if (res.data.success) {
        setIsLoggedIn(true);
        setUserData(res.data.user);
      } else {
        setIsLoggedIn(false);
        setUserData(null);
      }
    } catch {
      setIsLoggedIn(false);
      setUserData(null);
    } finally {
      setAuthChecked(true);
    }
  };

  // Products used to be cached in localStorage with no expiry, so prices and
  // stock stayed wrong until the cache was cleared. They are small enough to
  // just fetch each visit.
  const fetchProducts = async () => {
    setProductLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/products`);
      setProductData(res.data);
    } catch {
      toast.error(t("shop.loadFail"));
    } finally {
      setProductLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    fetchProducts();
  }, []);

  useEffect(() => {
    const slim = cart.map(({ id, _id, name, sellingPrice, imageUrl, stockQuantity, quantity }) =>
      ({ id, _id, name, sellingPrice, imageUrl, stockQuantity, quantity }));
    try {
      localStorage.setItem("cart", JSON.stringify(slim));
    } catch {
      // private mode or full storage; the cart still works for this visit
    }
  }, [cart]);

  // after sign in: an empty cart picks up the one saved on the account,
  // anything already in the cart is kept and saved to the account instead
  useEffect(() => {
    if (!isLoggedIn) {
      cartSynced.current = false;
      return;
    }
    (async () => {
      try {
        if (cart.length === 0) {
          const res = await axios.get(`${backendUrl}/api/user/cart`);
          setCart(res.data.cart || []);
        }
      } catch {
        // the local cart is still there
      }
      cartSynced.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !cartSynced.current) return;
    const timer = setTimeout(() => {
      axios.post(`${backendUrl}/api/user/cart`, { items: cart }).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [cart, isLoggedIn, backendUrl]);

  const addToCart = (product, quantity = 1) => {
    const id = product.id || product._id;
    const inCart = cart.find((item) => item.id === id);
    const already = inCart ? inCart.quantity : 0;
    if (already + quantity > product.stockQuantity) {
      toast.info(t("shop.onlyLeft", { n: product.stockQuantity, name: product.name }));
      return;
    }
    if (inCart) {
      setCart(cart.map((item) => (item.id === id ? { ...item, quantity: already + quantity } : item)));
    } else {
      setCart([...cart, { ...product, id, _id: product._id || id, quantity }]);
    }
    toast.success(t("shop.added", { name: product.name }), { autoClose: 1800, hideProgressBar: true });
  };

  const updateCartItemQuantity = (id, quantity) => {
    setCart(cart.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const resetCart = () => setCart([]);

  const logout = async () => {
    try {
      await axios.post(`${backendUrl}/api/auth/logout`);
    } catch {
      // the cookie is gone either way once it expires
    }
    setIsLoggedIn(false);
    setUserData(null);
    setCart([]);
    localStorage.removeItem("cart");
  };

  const value = {
    backendUrl,
    isLoggedIn,
    setIsLoggedIn,
    userData,
    setUserData,
    checkAuthStatus,
    logout,
    cart,
    setCart,
    addToCart,
    resetCart,
    updateCartItemQuantity,
    removeFromCart,
    productData,
    productLoading,
    fetchProducts,
  };

  return (
    <AppContext.Provider value={value}>
      {authChecked ? (
        props.children
      ) : (
        <div className="min-h-screen grid place-items-center text-ink-2" role="status">
          <img src="/paw-heart.svg" alt="" className="w-12 h-12 animate-pulse" />
          <span className="sr-only">{t("common.loading")}</span>
        </div>
      )}
    </AppContext.Provider>
  );
};
