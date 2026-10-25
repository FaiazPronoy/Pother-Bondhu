import React, { useState, useEffect, useRef, useCallback, createContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../config";
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
  const { t } = useLang();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [cart, setCart] = useState(readLocalCart);
  const [authChecked, setAuthChecked] = useState(false);

  const [productData, setProductData] = useState([]);
  const [productLoading, setProductLoading] = useState(true);

  const cartSynced = useRef(false);

  axios.defaults.withCredentials = true;

  const checkAuthStatus = useCallback(async () => {
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
  }, []);

  const fetchProducts = useCallback(async () => {
    setProductLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/products`);
      setProductData(res.data);
    } catch {
      toast.error(t("shop.loadFail"));
    } finally {
      setProductLoading(false);
    }
  }, [t]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const slim = cart.map(({ id, _id, name, sellingPrice, imageUrl, stockQuantity, quantity }) =>
      ({ id, _id, name, sellingPrice, imageUrl, stockQuantity, quantity }));
    try {
      localStorage.setItem("cart", JSON.stringify(slim));
    } catch {
    }
  }, [cart]);

  useEffect(() => {
    if (!isLoggedIn) {
      cartSynced.current = false;
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/user/cart`);
        setCart((current) => (current.length === 0 ? res.data.cart || [] : current));
      } catch {
      }
      cartSynced.current = true;
    })();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !cartSynced.current) return;
    const timer = setTimeout(() => {
      axios.post(`${backendUrl}/api/user/cart`, { items: cart }).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [cart, isLoggedIn]);

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
