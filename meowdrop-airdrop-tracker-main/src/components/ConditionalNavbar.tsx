"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Disable scroll on login pages
    if (pathname === "/login" || pathname === "/") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    
    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [pathname]);
  
  // Don't show navbar on login pages
  if (pathname === "/login" || pathname === "/") {
    return null;
  }
  
  return <Navbar />;
}