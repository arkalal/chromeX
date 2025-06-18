"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiStar } from "react-icons/fi";
import styles from "./Testimonials.module.scss";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Content Creator",
      comment: "ChromeX has completely changed how I write online. I can draft emails, social posts, and articles in half the time with twice the quality. The AI suggestions are spot-on!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Software Developer",
      comment: "As a developer, I love how ChromeX helps me understand complex documentation. The summarize feature is a game-changer when reviewing technical content.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Digital Marketer",
      comment: "The ability to save notes across different websites has been incredible for my research. ChromeX's new tab dashboard keeps everything organized and accessible.",
      rating: 5
    }
  ];
  
  return (
    <section className={styles.testimonials}>
      <div className="container">
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>What Our Users Say</h2>
          <p>Join thousands of users who are transforming how they work online</p>
        </motion.div>
        
        <div className={styles.testimonialGrid}>
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index}
              className={styles.testimonialCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <div className={styles.testimonialContent}>
                <p>{testimonial.comment}</p>
              </div>
              <div className={styles.testimonialFooter}>
                <div className={styles.testimonialUser}>
                  <div className={styles.userAvatar}>
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className={styles.userInfo}>
                    <h4>{testimonial.name}</h4>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
                <div className={styles.testimonialRating}>
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className={i < testimonial.rating ? styles.active : ''} />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className={styles.stats}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.stat}>
            <span className={styles.statNumber}>20,000+</span>
            <span className={styles.statLabel}>Active Users</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>4.9</span>
            <span className={styles.statLabel}>Chrome Store Rating</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>1M+</span>
            <span className={styles.statLabel}>AI Interactions</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
