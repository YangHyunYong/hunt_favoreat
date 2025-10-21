import React from "react";
import { useNavigate } from "react-router-dom";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/app");
  };

  return (
    <div className="bg-white relative w-full min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-gray-300 flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <img
            src="/icons/mapExplorer.svg"
            alt="MapExplorer"
            className="w-7.5 h-7.5"
          />
          <span className="text-landing-content text-gray-950">
            MapExplorer
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="text-landing-content text-gray-950 hover:text-redorange-500 transition-colors"
          >
            Features
          </a>
          <a
            href="#"
            className="text-landing-content text-gray-950 hover:text-redorange-500 transition-colors"
          >
            Documentation
          </a>
          <button
            onClick={handleGetStarted}
            className="bg-redorange-500 hover:bg-redorange-600 text-white px-4 py-2 rounded-[14px] text-landing-button transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="items-center">
            <div className="space-y-8">
              {/* New Platform Release Badge */}
              <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                <div className="w-2 h-2 bg-redorange-500 rounded-full"></div>
                <span className="text-landing-content text-gray-950">
                  New Platform Release
                </span>
              </div>

              <h1 className="text-landing-content text-gray-950 text-4xl font-bold leading-tight">
                Explore, Review, and Share Your World
              </h1>

              <p className="text-landing-content text-gray-400 leading-relaxed max-w-[540px]">
                A comprehensive mapping and review platform that empowers users
                to discover locations, share experiences, and connect with
                communities through interactive maps and detailed reviews.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={handleGetStarted}
                  className="bg-redorange-500 hover:bg-redorange-600 text-white px-4 py-2 rounded-[14px] text-landing-button font-medium transition-colors flex items-center gap-2"
                >
                  Start Exploring
                  <img
                    src="/icons/arrow-narrow-right.svg"
                    alt="Arrow"
                    className="w-4 h-4"
                  />
                </button>
                <button className="bg-white border border-gray-200 text-gray-950 px-4 py-2 rounded-[14px] text-landing-button font-medium transition-colors">
                  View Documentation
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-8">
                <div>
                  <div className="text-landing-content text-gray-950">10K+</div>
                  <div className="text-landing-content-desc text-gray-400">
                    Active Users
                  </div>
                </div>
                <div>
                  <div className="text-landing-content text-gray-950">50K+</div>
                  <div className="text-landing-content-desc text-gray-400">
                    Reviews
                  </div>
                </div>
                <div>
                  <div className="text-landing-content text-gray-950">
                    99.9%
                  </div>
                  <div className="text-landing-content-desc text-gray-400">
                    Uptime
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center w-full bg-gray-100 rounded-[16px] mt-12">
            <img
              src="/icons/landingImage.svg"
              alt="Landing Page Image"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 pt-48">
        <div className="max-w-4xl mx-auto bg-gray-50 rounded-[16px]">
          <div className="text-center mb-16">
            <div className="text-landing-section-title text-gray-950 mb-[16.5px] pt-5">
              Powerful Features for Every Explorer
            </div>
            <p className="text-landing-content text-gray-400 max-w-2xl mx-auto">
              Our platform combines advanced mapping technology with social
              features to create a comprehensive exploration and review
              experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 mx-4">
            <div className="bg-white rounded-2xl p-8 shadow-sm h-[260px]">
              <div className="w-12 h-12 bg-[rgba(255,69,0,0.10)] rounded-[16px] flex items-center justify-center mb-[15.5px]">
                <img
                  src="/icons/landing-01.svg"
                  alt="Map"
                  className="w-6 h-6"
                />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Interactive Maps
              </h3>
              <p className="text-landing-content text-gray-400">
                Explore detailed maps with real-time location tracking and
                custom markers. Navigate seamlessly through different regions
                and discover new places.
              </p>
            </div>

            {/* Review System */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-[16px] flex items-center justify-center mb-[15.5px]">
                <img
                  src="/icons/landing-02.svg"
                  alt="Review"
                  className="w-6 h-6"
                />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Review System
              </h3>
              <p className="text-landing-content text-gray-400 ">
                Write comprehensive reviews with text, images, and ratings.
                Share your experiences and help others make informed decisions.
              </p>
            </div>

            {/* Bookmarks & Collections */}
            <div className="bg-white rounded-[16px] p-8 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-[16px] flex items-center justify-center mb-[15.5px]">
                <img
                  src="/icons/landing-03.svg"
                  alt="Bookmark"
                  className="w-6 h-6"
                />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Bookmarks & Collections
              </h3>
              <p className="text-landing-content text-gray-400">
                Save your favorite locations and organize them into custom
                collections. Access your bookmarks anytime, anywhere.
              </p>
            </div>

            {/* Rating System */}
            <div className="bg-white rounded-[16px] p-8 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-[16px] flex items-center justify-center mb-[15.5px]">
                <img
                  src="/icons/landing-04.svg"
                  alt="Rating"
                  className="w-6 h-6"
                />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Rating System
              </h3>
              <p className="text-landing-content text-gray-400 ">
                Rate locations and experiences with our intuitive rating system.
                See aggregate ratings from the community.
              </p>
            </div>

            {/* Social Features */}
            <div className="bg-white rounded-[16px] p-8 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-[16px] flex items-center justify-center mb-[15.5px]">
                <img
                  src="/icons/landing-05.svg"
                  alt="Social"
                  className="w-6 h-6"
                />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Social Features
              </h3>
              <p className="text-landing-content text-gray-400">
                Connect with other users, follow their reviews, and build a
                community of explorers and contributors.
              </p>
            </div>

            {/* Secure & Private */}
            <div className="bg-white rounded-[16px] p-8 shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-[16px] flex items-center justify-center mb-[15.5px]">
                <img
                  src="/icons/landing-06.svg"
                  alt="Security"
                  className="w-6 h-6"
                />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Secure & Private
              </h3>
              <p className="text-landing-content text-gray-400">
                Your data is protected with industry-standard security. Control
                your privacy settings and manage what you share.
              </p>
            </div>
          </div>

          {/* Review Section */}
          <div className="mx-4 mt-16 mb-4">
            <div className="items-center">
              <div className="">
                <h2 className="text-landing-section-title text-gray-950 mb-6">
                  Express Yourself Through Reviews
                </h2>
                <p className="text-landing-content-desc text-gray-400 mb-6">
                  Share your experiences with our intuitive review writing
                  system. Add photos, ratings, and detailed descriptions to help
                  others discover amazing places.
                </p>

                <div className="space-y-4 mb-12">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 ">
                      <img
                        src="/icons/landing-point.svg"
                        alt="Rich Text Editor"
                        className="w-6 h-6"
                      />
                    </div>
                    <div>
                      <h4 className="text-landing-content text-gray-950">
                        Rich Text Editor
                      </h4>
                      <p className="text-landing-content-desc text-gray-400">
                        Format your reviews with ease using our advanced text
                        editor
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 ">
                      <img
                        src="/icons/landing-point.svg"
                        alt="Rich Text Editor"
                        className="w-6 h-6"
                      />
                    </div>
                    <div>
                      <h4 className="text-landing-content text-gray-950">
                        Photo Upload
                      </h4>
                      <p className="text-landing-content-desc text-gray-400">
                        Add multiple images to showcase your experience
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 ">
                      <img
                        src="/icons/landing-point.svg"
                        alt="Rich Text Editor"
                        className="w-6 h-6"
                      />
                    </div>
                    <div>
                      <h4 className="text-landing-content text-gray-950">
                        Rating Categories
                      </h4>
                      <p className="text-landing-content-desc text-gray-400">
                        Rate different aspects of your experience
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center items-center w-full h-[414px] mb-[180px]">
                  <img
                    src="/icons/landing-image-2.svg"
                    alt="Landing Page Image 2"
                    className="object-cover w-full h-full rounded-[16px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* 2x2 Grid Layout */}
          <div className="grid grid-cols-2 gap-12 mb-12">
            {/* Top Left - Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img
                  src="/icons/mapExplorer.svg"
                  alt="MapExplorer"
                  className="w-6 h-6"
                />
                <span className="text-landing-content text-gray-950">
                  MapExplorer
                </span>
              </div>
              <p className="text-landing-content text-gray-400 max-w-sm">
                Empowering explorers to discover, review, and share amazing
                places around the world.
              </p>
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-[16px] flex items-center justify-center">
                  <img src="/icons/x.svg" alt="Social" className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-[16px] flex items-center justify-center">
                  <img
                    src="/icons/github.svg"
                    alt="Social"
                    className="w-5 h-5"
                  />
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-[16px] flex items-center justify-center">
                  <img
                    src="/icons/linkedin.svg"
                    alt="Social"
                    className="w-5 h-5"
                  />
                </div>
              </div>
            </div>

            {/* Top Right - Product */}
            <div>
              <h4 className="text-landing-footer-title text-gray-950 mb-[18.5px]">
                Product
              </h4>
              <div className="space-y-3">
                <a
                  href="#"
                  className="block text-landing-content text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#"
                  className="block text-landing-content text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Documentation
                </a>
                <a
                  href="#"
                  className="block text-landing-content text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="#"
                  className="block text-landing-content text-gray-400 hover:text-gray-700 transition-colors"
                >
                  API Reference
                </a>
              </div>
            </div>

            {/* Bottom Left - Company */}
            <div>
              <h4 className="text-landing-footer-title text-gray-950 mb-4">
                Company
              </h4>
              <div className="space-y-3">
                <a
                  href="#"
                  className="block text-landing-content text-gray-400 hover:text-gray-700 transition-colors"
                >
                  About Us
                </a>
                <a
                  href="#"
                  className="block text-landing-content text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Blog
                </a>
                <a
                  href="#"
                  className="block text-landing-content text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Careers
                </a>
                <a
                  href="#"
                  className="block text-landing-content text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>

            {/* Bottom Right - Stay Updated */}
            <div>
              <h4 className="text-landing-content text-gray-950 mb-4">
                Stay Updated
              </h4>
              <p className="text-landing-content text-gray-400 mb-4">
                Get the latest updates and features delivered to your inbox.
              </p>
              <div className="space-y-2">
                <div className="bg-white border border-gray-100 rounded-[14px] h-[36px] px-3 py-1 flex items-center">
                  <span className="text-[14px] text-gray-400">
                    Enter your email
                  </span>
                </div>
                <button className="bg-redorange-500 hover:bg-redorange-600 text-landing-button text-white rounded-[14px] w-full h-9 py-2 text-button-content transition-colors flex justify-center items-center gap-4">
                  <img src="/icons/email.svg" alt="Arrow" className="w-4 h-4" />
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-landing-content-desc text-gray-400 mb-4 md:mb-0">
                © 2024 MapExplorer. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a
                  href="#"
                  className="text-landing-content text-gray-400 hover:text-gray-950 transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-landing-content text-gray-400 hover:text-gray-950 transition-colors"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="text-landing-content text-gray-400 hover:text-gray-950 transition-colors"
                >
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
