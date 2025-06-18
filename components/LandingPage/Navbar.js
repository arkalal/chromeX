"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiMenu, FiX } from "react-icons/fi";
import styles from "./Navbar.module.scss";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.container}>
        <motion.div 
          className={styles.logo}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/">
            <span className={styles.logoText}>ChromeX</span>
          </Link>
        </motion.div>

        <div className={styles.desktopNav}>
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How it Works</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#faq">FAQ</a></li>
          </motion.ul>
          
          <motion.div 
            className={styles.authButtons}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <button className="btn btn-primary">Sign In</button>
          </motion.div>
        </div>

        <div className={styles.mobileNavToggle}>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div 
        className={styles.mobileMenu}
        initial={false}
        animate={{ height: mobileMenuOpen ? "auto" : 0 }}
        transition={{ duration: 0.3 }}
      >
        <ul>
          <li><a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a></li>
          <li><a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it Works</a></li>
          <li><a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a></li>
          <li><a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a></li>
          <li className={styles.mobileAuthButton}>
            <button className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>Sign In</button>
          </li>
        </ul>
      </motion.div>
    </nav>
  );
};

export default Navbar;
