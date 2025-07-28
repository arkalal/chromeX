"use client";

import React from "react";
import Link from "next/link";
import { FiGithub, FiTwitter, FiInstagram, FiLinkedin } from "react-icons/fi";
import styles from "./Footer.module.scss";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.footerLogo}>
              <span>ChromeX</span>
            </Link>
            <p className={styles.footerTagline}>
              Supercharge your browser with AI writing assistant
            </p>
            <div className={styles.socialLinks}>
              <a href="https://x.com/arka_codes" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <FiTwitter />
              </a>
              <a href="#" aria-label="Instagram">
                <FiInstagram />
              </a>
              <a href="https://www.linkedin.com/in/arkalal/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <FiLinkedin />
              </a>
              <a href="#" aria-label="GitHub">
                <FiGithub />
              </a>
            </div>
          </div>
          
          <div className={styles.footerNav}>
            <div className={styles.footerNavCol}>
              <h3>Product</h3>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#how-it-works">How it Works</a></li>
                <li><a href="#">Roadmap</a></li>
              </ul>
            </div>
            
            <div className={styles.footerNavCol}>
              <h3>Resources</h3>
              <ul>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Tutorials</a></li>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">API Reference</a></li>
              </ul>
            </div>
            
            <div className={styles.footerNavCol}>
              <h3>Company</h3>
              <ul>
                <li><a href="#">About</a></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press Kit</a></li>
              </ul>
            </div>
            
            <div className={styles.footerNavCol}>
              <h3>Legal</h3>
              <ul>
                <li><Link href="/legal/privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/legal/terms-of-service">Terms of Service</Link></li>
                <li><Link href="/legal/cookie-policy">Cookie Policy</Link></li>
                <li><Link href="/legal/gdpr">GDPR</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <div className={styles.copyright}>
            &copy; {currentYear} ChromeX AI. All rights reserved.
          </div>
          
          <div className={styles.madeWith}>
            <span>Made with</span> <span className={styles.heart}>❤️</span> <span>by the ChromeX team</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
