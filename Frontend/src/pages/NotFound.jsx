import React from "react";
import { Link } from "react-router-dom";
import phonesImg from "../assets/phones.png";
import "../styles/NotFound.css";

const NotFound = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="not-found-page">
      <div className="not-found-main">
        <div className="not-found-content">
          <div className="not-found-image">
            <img src={phonesImg} alt="Page not found" />
          </div>
          <div className="not-found-info">
            <h1>Oops! Page Not Found (404 Error)</h1>
            <p>
              We're sorry, but the page you're looking for doesn't seem to exist.
              If you typed the URL manually, please double-check the spelling.
              If you clicked on a link, it may be outdated or broken.
            </p>
            <Link to="/" className="not-found-btn">
              Go back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Футер */}
      <footer className="not-found-footer">
        <nav className="footer-nav">
          <Link to="/">Home</Link>
          <Link to="/search">Search</Link>
          <Link to="/explore">Explore</Link>
          <Link to="/messages">Messages</Link>
          <Link to="/notifications">Notifications</Link>
          <Link to="/create">Create</Link>
        </nav>
        <p className="copyright">© {currentYear} ICHGram</p>
      </footer>
    </div>
  );
};

export default NotFound;