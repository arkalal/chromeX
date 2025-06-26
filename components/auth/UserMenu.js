"use client";

import { useState, useRef, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiLogOut } from "react-icons/fi";
import Image from "next/image";
import styles from "./UserMenu.module.scss";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const loading = status === "loading";
  const authenticated = status === "authenticated";

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
    setIsOpen(false);
  };

  // Animation variants
  const menuVariants = {
    hidden: { 
      opacity: 0, 
      y: -10,
      scale: 0.95,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      } 
    },
    exit: { 
      opacity: 0, 
      y: -10,
      scale: 0.95,
      transition: { 
        duration: 0.2 
      } 
    }
  };

  if (loading) {
    return (
      <div className={styles.userMenu}>
        <div className={styles.loadingAvatar}></div>
      </div>
    );
  }

  return (
    <div className={styles.userMenu} ref={menuRef}>
      {authenticated ? (
        <>
          <button 
            className={styles.avatarButton} 
            onClick={() => setIsOpen(!isOpen)} 
            aria-label="User menu"
          >
            {session?.user?.image ? (
              <motion.div 
                className={styles.avatar}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Image 
                  src={session.user.image} 
                  alt={session.user.name || "User"} 
                  fill
                  sizes="40px"
                  style={{ objectFit: 'cover' }}
                />
              </motion.div>
            ) : (
              <div className={styles.defaultAvatar}>
                <FiUser />
              </div>
            )}
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                className={styles.dropdown}
                variants={menuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className={styles.userInfo}>
                  <div className={styles.userImage}>
                    {session?.user?.image ? (
                      <div className={styles.imageWrapper}>
                        <Image 
                          src={session.user.image} 
                          alt={session.user.name || "User"} 
                          fill
                          sizes="56px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div className={styles.defaultAvatarLarge}>
                        <FiUser />
                      </div>
                    )}
                  </div>
                  <div className={styles.userDetails}>
                    <h3>{session?.user?.name || "User"}</h3>
                    <p>{session?.user?.email || ""}</p>
                  </div>
                </div>
                
                <div className={styles.divider}></div>
                
                <button 
                  className={styles.signOutButton} 
                  onClick={handleSignOut}
                >
                  <FiLogOut />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <motion.button 
          className={styles.signInButton}
          onClick={handleSignIn}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Sign In
        </motion.button>
      )}
    </div>
  );
}
