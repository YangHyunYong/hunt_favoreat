import React from "react";
import { useNavigate } from "react-router-dom";

// Figma 아이콘 상수들
const imgImageWithFallback =
  "https://www.figma.com/api/mcp/asset/db6ceb6a-0072-42ad-ad3c-30e33b1556b1";
const imgImageWithFallback1 =
  "https://www.figma.com/api/mcp/asset/13b931c5-c909-42f0-9433-4fea6bb97437";
const imgImageWithFallback2 =
  "https://www.figma.com/api/mcp/asset/34e7d2ad-2bb8-4412-b21d-c3d68dd24879";
const imgIcon =
  "https://www.figma.com/api/mcp/asset/97ebf536-35cd-447e-8c4d-2aaa3206732d";
const imgIcon1 =
  "https://www.figma.com/api/mcp/asset/8229c0bc-bcb0-4a33-ad36-2cf1ca449239";
const imgIcon2 =
  "https://www.figma.com/api/mcp/asset/3c662dda-db48-441b-8ea9-2e5106dd0a30";
const imgIcon3 =
  "https://www.figma.com/api/mcp/asset/bbbf23ca-7195-4a4f-ae5c-5695d2a0b28c";
const imgIcon4 =
  "https://www.figma.com/api/mcp/asset/ca2cbd16-fef2-427a-bcca-2bc0efc1834d";
const imgIcon5 =
  "https://www.figma.com/api/mcp/asset/196c3d5f-4454-4d10-b06f-92185ee3f341";
const imgIcon6 =
  "https://www.figma.com/api/mcp/asset/eb1ae80a-5c2a-42e8-a858-5baa20daf0e9";
const imgIcon7 =
  "https://www.figma.com/api/mcp/asset/a4a59a0a-3ba9-497f-be82-98ef849d21c3";
const imgIcon8 =
  "https://www.figma.com/api/mcp/asset/886a489c-a4d2-494c-8c3c-7b1590225344";
const imgIcon9 =
  "https://www.figma.com/api/mcp/asset/c743b45a-4230-4d29-b708-324e3c6dc5b4";
const imgIcon10 =
  "https://www.figma.com/api/mcp/asset/1f6004d3-bdae-427d-8e16-226dd2e6a835";
const imgIcon11 =
  "https://www.figma.com/api/mcp/asset/5eb974a0-a974-4aa3-a226-5abc601e4ddb";
const imgIcon12 =
  "https://www.figma.com/api/mcp/asset/240c1384-f35b-4161-ae43-874ae5ab45b5";
const imgIcon13 =
  "https://www.figma.com/api/mcp/asset/d54b8f2a-497b-4964-b157-e6efdf4bcf70";
const imgIcon14 =
  "https://www.figma.com/api/mcp/asset/94522a38-f75a-4cac-b0ab-91817f2f652e";
const imgIcon15 =
  "https://www.figma.com/api/mcp/asset/e7dd6911-8937-4117-b1da-7055e4f644bf";
const imgIcon16 =
  "https://www.figma.com/api/mcp/asset/a71d31b5-cd57-431d-95c0-82a93d9a922a";
const imgIcon17 =
  "https://www.figma.com/api/mcp/asset/1044e4bb-13e5-4793-9106-5dc165aa8fb3";
const imgIcon18 =
  "https://www.figma.com/api/mcp/asset/f0319bc4-22a7-4fd3-a063-43f00986aab1";
const imgIcon19 =
  "https://www.figma.com/api/mcp/asset/c99d5651-72fe-4936-8a47-1d8c26e7917b";
const imgIcon20 =
  "https://www.figma.com/api/mcp/asset/63655f0d-ba0e-4ad8-9e7b-247970f21307";
const imgIcon21 =
  "https://www.figma.com/api/mcp/asset/01305f5c-06c8-44dc-a344-75200c1808d0";
const imgIcon22 =
  "https://www.figma.com/api/mcp/asset/5dc800dc-b640-44b0-b381-64805aa8916c";
const imgIcon23 =
  "https://www.figma.com/api/mcp/asset/76a5bb11-501e-474a-ae56-20e1adab73f1";
const imgIcon24 =
  "https://www.figma.com/api/mcp/asset/f3cb0b01-2357-4f01-b303-e6189868ee69";
const imgIcon25 =
  "https://www.figma.com/api/mcp/asset/8244709f-669c-4432-81c6-7a0953967021";
const imgIcon26 =
  "https://www.figma.com/api/mcp/asset/57e3e4ba-8faf-46d1-a112-d51ffc56ab41";
const imgIcon27 =
  "https://www.figma.com/api/mcp/asset/ee07b22d-cd31-4544-a2c2-f0f5fec2c153";
const imgIcon28 =
  "https://www.figma.com/api/mcp/asset/6d2efc12-7f20-4fe4-98ab-5458a19d3a94";
const imgIcon29 =
  "https://www.figma.com/api/mcp/asset/c50d8579-5559-455a-9c39-8bf371207611";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/app");
  };

  return (
    <div className="bg-white relative w-full min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between py-4 px-6 mx-auto border-b border-gray-300">
        <div className="flex items-center gap-2">
          <img
            src={"/icons/logo.svg"}
            alt="favoreat"
            className="w-[28px] h-[28px]"
          />
          <span className="text-landing-content text-gray-950 font-medium">
            FavorEat
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="#problem"
            className="text-landing-content text-gray-950 hover:text-redorange-500 transition-colors"
          >
            Problem
          </a>
          <a
            href="#features"
            className="text-landing-content text-gray-950 hover:text-redorange-500 transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-landing-content text-gray-950 hover:text-redorange-500 transition-colors"
          >
            How It Works
          </a>
          <button
            onClick={handleGetStarted}
            className="bg-redorange-500 hover:bg-redorange-600 text-white px-4 py-2 rounded-[14px] text-sm font-medium transition-colors"
          >
            Launch App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-[128px]">
        <div className="max-w-[1024px] mx-auto overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 h-10">
                <div className="w-2 h-2 bg-redorange-500 rounded-full"></div>
                <span className="text-sm text-gray-950">
                  Built on Base & Farcaster
                </span>
              </div>

              <h1 className="text-landing-content text-gray-950 ">
                Where Honest Reviews Have Fair Value
              </h1>

              <p className="text-landing-content text-gray-400 leading-relaxed max-w-[458px]">
                favoreat is a Web3 mini-app that transforms restaurant reviews
                into a simple, trustworthy, and rewarding experience. Built on
                Base and Farcaster, we ensure every honest review receives fair
                recognition.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={handleGetStarted}
                  className="bg-redorange-500 hover:bg-redorange-600 text-white px-4 py-2 rounded-[14px] text-sm font-medium transition-colors flex items-center gap-2"
                >
                  Start Reviewing
                  <img src={imgIcon28} alt="Arrow" className="w-4 h-4" />
                </button>
                <button className="bg-white border border-gray-200 text-gray-950 px-4 py-2 rounded-[14px] text-sm font-medium transition-colors flex items-center gap-2">
                  View on Farcaster
                  <img src={imgIcon29} alt="Arrow" className="w-4 h-4" />
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-8">
                <div>
                  <div className="text-landing-content text-gray-950">100%</div>
                  <div className="text-landing-content-desc text-gray-400">
                    Verified
                  </div>
                </div>
                <div>
                  <div className="text-landing-content text-gray-950">
                    On-Chain
                  </div>
                  <div className="text-landing-content-desc text-gray-400">
                    Transparency
                  </div>
                </div>
                <div>
                  <div className="text-landing-content text-gray-950">
                    48hrs
                  </div>
                  <div className="text-landing-content-desc text-gray-400">
                    Verification
                  </div>
                </div>
              </div>
            </div>

            <div className="relative rounded-[16px] h-[400px] flex items-center justify-center">
              <img
                src="/icons/phone-back-1.svg"
                alt="Phone Back"
                className="absolute right-[-5px] top-[5px] w-[410px] h-[400px] object-cover rounded-[16px]"
              />
              <img
                src={"/icons/phone-front-1.svg"}
                alt="Trust Built Into Every Review"
                className="absolute right-[85px] top-[5px] w-[410px] h-[400px] object-cover rounded-[16px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section id="problem" className="py-32 bg-white">
        <div className="max-w-[1024px] mx-auto">
          {/* Problem Section */}
          <div className="text-center mb-[80.5px]">
            <h2 className="text-landing-section-title text-gray-950 mb-4">
              The Problem with Traditional Review Platforms
            </h2>
            <p className="text-landing-content-desc text-gray-400 max-w-[750px] mx-auto">
              Web2 review platforms like Google and Naver suffer from low trust
              due to sponsored content, and reviewers don't receive fair
              recognition for their authentic experiences. Users struggle to
              find "truly good restaurants" while reviewers lose motivation as
              their contributions become mere data points.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-[79px]">
            <div className="rounded-[16px] border border-[rgba(239,68,68,0.20)] bg-[rgba(239,68,68,0.05)] p-6 h-[206px]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-[15.5px]">
                <img
                  src={imgIcon}
                  alt="Sponsored Content"
                  className="w-8 h-8"
                />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Sponsored Content
              </h3>
              <p className="text-gray-400 w-">
                Web2 review platforms are flooded with paid and promotional
                reviews, making it hard to trust ratings
              </p>
            </div>

            <div className="rounded-[16px] border border-[rgba(239,68,68,0.20)] bg-[rgba(239,68,68,0.05)] p-6 h-[206px]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-[15.5px]">
                <img src={imgIcon} alt="No Recognition" className="w-8 h-8" />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                No Recognition
              </h3>
              <p className="text-gray-400">
                Reviewers spend time writing honest reviews but receive no fair
                compensation or acknowledgment
              </p>
            </div>

            <div className="rounded-[16px] border border-[rgba(239,68,68,0.20)] bg-[rgba(239,68,68,0.05)] p-6 h-[206px]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-[15.5px]">
                <img src={imgIcon} alt="Fake Reviews" className="w-8 h-8" />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Fake Reviews
              </h3>
              <p className="text-gray-400">
                Lack of verification allows automated and fake reviews to
                pollute the ecosystem
              </p>
            </div>
          </div>

          {/* Solution Section */}
          <div className="text-center mb-[48.5px]">
            <h2 className="text-landing-section-title text-gray-950 mb-4">
              How favoreat Solves This
            </h2>
            <p className="text-landing-content-desc text-gray-400 max-w-3xl mx-auto">
              favoreat creates a trusted review structure on-chain, where users
              can easily write, share, and get rewarded for authentic restaurant
              reviews within the Farcaster ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="rounded-[16px] border border-[rgba(34,197,94,0.20)] bg-[rgba(34,197,94,0.05)] p-6">
              <div className="w-8 h-8 flex items-center justify-center mb-4">
                <img
                  src={imgIcon1}
                  alt="EXIF Verification"
                  className="w-8 h-8"
                />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                EXIF Verification
              </h3>
              <p className="text-gray-400">
                Only photos taken within 48 hours with location data are
                accepted, ensuring authentic experiences
              </p>
            </div>

            <div className="rounded-[16px] border border-[rgba(34,197,94,0.20)] bg-[rgba(34,197,94,0.05)] p-6">
              <div className="w-8 h-8 flex items-center justify-center mb-4">
                <img src={imgIcon2} alt="Point Rewards" className="w-8 h-8" />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Point Rewards
              </h3>
              <p className="text-gray-400">
                Earn points for reviews and community engagement, with future
                NFT and token opportunities
              </p>
            </div>

            <div className="rounded-[16px] border border-[rgba(34,197,94,0.20)] bg-[rgba(34,197,94,0.05)] p-6">
              <div className="w-8 h-8 flex items-center justify-center mb-4">
                <img src={imgIcon3} alt="On-Chain Trust" className="w-8 h-8" />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                On-Chain Trust
              </h3>
              <p className="text-gray-400">
                Review data stored on Base blockchain ensures transparency and
                immutability
              </p>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="bg-gray-50 rounded-[16px] pt-12 px-12 h-[216px]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <img
                    src={imgIcon4}
                    alt="Photo Verification"
                    className="w-12 h-12"
                  />
                </div>
                <h4 className="text-landing-content text-gray-950 mb-2">
                  Photo Verification
                </h4>
                <p className="text-landing-content text-gray-400">
                  EXIF + GPS check
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <img
                    src={imgIcon5}
                    alt="Base Network"
                    className="w-12 h-12"
                  />
                </div>
                <h4 className="text-landing-content text-gray-950 mb-2">
                  Base Network
                </h4>
                <p className="text-landing-content text-gray-400">
                  On-chain storage
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <img
                    src={imgIcon6}
                    alt="Farcaster Frames"
                    className="w-12 h-12"
                  />
                </div>
                <h4 className="text-landing-content text-gray-950 mb-2">
                  Farcaster Frames
                </h4>
                <p className="text-landing-content text-gray-400">
                  Easy sharing
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <img src={imgIcon7} alt="Anti-Abuse" className="w-12 h-12" />
                </div>
                <h4 className="text-landing-content text-gray-950 mb-2">
                  Anti-Abuse
                </h4>
                <p className="text-landing-content text-gray-400">
                  Quality control
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="px-4 rounded-[16px] bg-gray-50 max-w-[1024px] h-[1317px] mx-auto overflow-hidden"
      >
        <div className="max-w-[1024px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-landing-section-title text-gray-950 mb-[16.5px]">
              Core Features
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              favoreat combines Web3 technology with practical verification
              systems to create a trusted restaurant review ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-[79px]">
            <div className="bg-white rounded-[16px] p-8 shadow-sm">
              <div className="w-12 h-12 bg-[rgba(255,69,0,0.10)] rounded-[16px] flex items-center justify-center mb-4">
                <img
                  src={imgIcon8}
                  alt="Location-Based Verification"
                  className="w-6 h-6"
                />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Location-Based Verification
              </h3>
              <p className="text-landing-content text-gray-400">
                Upload photos taken within 48 hours with EXIF data to ensure
                authentic, real-time restaurant experiences
              </p>
            </div>

            <div className="bg-white rounded-[16px] p-8 shadow-sm">
              <div className="w-12 h-12 bg-[rgba(59,130,246,0.10)] rounded-[16px] flex items-center justify-center mb-4">
                <img
                  src={imgIcon9}
                  alt="Point Reward System"
                  className="w-6 h-6"
                />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Point Reward System
              </h3>
              <p className="text-landing-content text-gray-400">
                Earn points for writing reviews and community engagement (likes,
                casts, replies). Points unlock NFTs and level-up opportunities
              </p>
            </div>

            <div className="bg-white rounded-[16px] p-8 shadow-sm">
              <div className="w-12 h-12 bg-[rgba(20,184,166,0.10)] rounded-[16px] flex items-center justify-center mb-4">
                <img
                  src={imgIcon10}
                  alt="Farcaster Frame Integration"
                  className="w-6 h-6"
                />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Farcaster Frame Integration
              </h3>
              <p className="text-landing-content text-gray-400">
                Write reviews and automatically cast them to your Farcaster feed
                with one click, enabling seamless social sharing
              </p>
            </div>

            <div className="bg-white rounded-[16px] p-8 shadow-sm">
              <div className="w-12 h-12 bg-[rgba(139,92,246,0.10)] rounded-[16px] flex items-center justify-center mb-4">
                <img
                  src={imgIcon11}
                  alt="Anti-Abuse Protection"
                  className="w-6 h-6"
                />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Anti-Abuse Protection
              </h3>
              <p className="text-landing-content text-gray-400">
                Rate limiting, quality checks, and account moderation prevent
                spam and maintain community trust
              </p>
            </div>

            <div className="bg-white rounded-[16px] p-8 shadow-sm">
              <div className="w-12 h-12 bg-[rgba(34,197,94,0.10)] rounded-[16px] flex items-center justify-center mb-4">
                <img
                  src={imgIcon12}
                  alt="On-Chain Storage"
                  className="w-6 h-6"
                />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                On-Chain Storage
              </h3>
              <p className="text-landing-content text-gray-400">
                Review metadata stored on Base blockchain for transparency.
                Detailed content stored off-chain for efficiency
              </p>
            </div>

            <div className="bg-white rounded-[16px] p-8 shadow-sm">
              <div className="w-12 h-12 bg-[rgba(239,68,68,0.10)] rounded-[16px] flex items-center justify-center mb-4">
                <img
                  src={imgIcon13}
                  alt="Community Driven"
                  className="w-6 h-6"
                />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Community Driven
              </h3>
              <p className="text-landing-content text-gray-400">
                Built for the Farcaster community with social features that
                reward genuine participation and engagement
              </p>
            </div>
          </div>

          {/* Trust Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-[16px] h-[400px] flex items-center justify-center">
              <img
                src="/icons/phone-back.png"
                alt="Phone Back"
                className="absolute right-[-110px] top-[70px] w-[720px] h-[560px] object-cover rounded-[16px]"
              />
              <img
                src={"/icons/phone-front.png"}
                alt="Trust Built Into Every Review"
                className="absolute right-[90px] top-[-30px] w-[720px] h-[660px] object-cover rounded-[16px]"
              />
            </div>
            <div className="space-y-6">
              <h3 className="text-landing-section-title text-gray-950">
                Trust Built Into Every Review
              </h3>
              <p className="text-landing-content-desc text-gray-400 max-w-[466px]">
                Our verification system ensures that every review comes from a
                real visit. By combining photo EXIF data, GPS location, and time
                stamps, we create an ecosystem where fake reviews simply can't
                exist.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <img
                    src={"/icons/landing-point.svg"}
                    alt="48-Hour Window"
                    className="w-6 h-6"
                  />
                  <div>
                    <h4 className="text-landing-content text-gray-950 mb-1">
                      48-Hour Window
                    </h4>
                    <p className="text-landing-content-desc text-gray-400">
                      Only photos taken within 48 hours are accepted
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <img
                    src={"/icons/landing-point.svg"}
                    alt="48-Hour Window"
                    className="w-6 h-6"
                  />
                  <div>
                    <h4 className="text-landing-content text-gray-950 mb-1">
                      GPS Verification
                    </h4>
                    <p className="text-landing-content-desc text-gray-400">
                      Location data must match restaurant coordinates
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <img
                    src={"/icons/landing-point.svg"}
                    alt="48-Hour Window"
                    className="w-6 h-6"
                  />
                  <div>
                    <h4 className="text-landing-content text-gray-950 mb-1">
                      Quality Controls
                    </h4>
                    <p className="text-landing-content-desc text-gray-400">
                      Rate limiting and automated quality checks
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-4 pt-[204px] bg-white">
        <div className="max-w-[1024px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-landing-section-title text-gray-950 mb-4">
              How It Works
            </h2>
            <p className="text-landing-content-desc text-gray-400 max-w-3xl mx-auto">
              The review process is designed to be easy, secure, and meaningful.
              Four simple steps transform your dining experience into a trusted,
              rewarded contribution.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            <div className="w-[1000px] h-[2px] border-gray-200 bg-gray-200 absolute left-2 top-16"></div>
            <div className="bg-white border border-gray-200 rounded-[16px] p-6 text-center relative h-[318px]">
              <div className="w-16 h-16 bg-[rgba(255,69,0,0.10)] rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <img
                  src={imgIcon14}
                  alt="Search for a Place"
                  className="w-8 h-8"
                />
                <div className="absolute bg-redorange-500 rounded-full w-8 h-8 flex items-center justify-center -top-2 -right-2">
                  <span className="text-white text-landing-content">1</span>
                </div>
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Search for a Place
              </h3>
              <p className="text-landing-content text-gray-400">
                Find the restaurant you visited using our location-based search
                within the favoreat mini-app
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-[16px] p-6 text-center relative h-[318px]">
              <div className="w-16 h-16 bg-[rgba(255,69,0,0.10)] rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <img
                  src={imgIcon15}
                  alt="Write Your Review"
                  className="w-8 h-8"
                />
                <div className="absolute bg-redorange-500 rounded-full w-8 h-8 flex items-center justify-center -top-2 -right-2">
                  <span className="text-white text-landing-content">2</span>
                </div>
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Write Your Review
              </h3>
              <p className="text-landing-content text-gray-400">
                Upload photos (with EXIF data verified), add your ratings, and
                write detailed text reviews on the map
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-[16px] p-6 text-center relative h-[318px]">
              <div className="w-16 h-16 bg-[rgba(255,69,0,0.10)] rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <img
                  src={imgIcon16}
                  alt="Share to Community"
                  className="w-8 h-8"
                />
                <div className="absolute bg-redorange-500 rounded-full w-8 h-8 flex items-center justify-center -top-2 -right-2">
                  <span className="text-white text-landing-content">3</span>
                </div>
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Share to Community
              </h3>
              <p className="text-landing-content text-gray-400">
                Your review automatically creates a Farcaster cast, sharing your
                experience with the community
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-[16px] p-6 text-center relative h-[318px]">
              <div className="w-16 h-16 bg-[rgba(255,69,0,0.10)] rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <img src={imgIcon17} alt="Earn Rewards" className="w-8 h-8" />
                <div className="absolute bg-redorange-500 rounded-full w-8 h-8 flex items-center justify-center -top-2 -right-2">
                  <span className="text-white text-landing-content">4</span>
                </div>
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Earn Rewards
              </h3>
              <p className="text-landing-content text-gray-400">
                Receive points for reviews and engagement. Points unlock future
                NFT, token, and level-up opportunities
              </p>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-gray-50 rounded-[16px] py-12 px-12 max-w-[896px] mx-auto mb-32">
            <h3 className="text-landing-content text-gray-950 text-center mb-8">
              Making Reviews Easy, Safe, and Meaningful
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-[rgba(255,69,0,0.10)] rounded-[16px] flex items-center justify-center mx-auto mb-4">
                  <span className="text-redorange-500">✓</span>
                </div>
                <h4 className="text-landing-content text-gray-950 mb-2">
                  Easier
                </h4>
                <p className="text-landing-content text-gray-400">
                  Write reviews directly within the Base/Farcaster mini-app
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[rgba(59,130,246,0.10)] rounded-[16px] flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-500">✓</span>
                </div>
                <h4 className="text-landing-content text-gray-950 mb-2">
                  Safer
                </h4>
                <p className="text-landing-content text-gray-400">
                  48-hour photo verification and EXIF location data prevent fake
                  reviews
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[rgba(20,184,166,0.10)] rounded-[16px] flex items-center justify-center mx-auto mb-4">
                  <span className="text-teal-500">✓</span>
                </div>
                <h4 className="text-landing-content text-gray-950 mb-2">
                  Meaningful
                </h4>
                <p className="text-landing-content text-gray-400">
                  Your contributions are recognized and rewarded by the
                  community
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We're Different Section */}
      <section className="px-16 mt-20 py-12 mb-[155px] bg-gray-50 max-w-[1024px] mx-auto rounded-[16px]">
        <div className="max-w-[1024px] mx-auto">
          <div className="text-center mb-[104px]">
            <h2 className="text-landing-section-title text-gray-950 mb-4">
              How We're Different
            </h2>
            <p className="text-landing-content-desc text-gray-400 max-w-3xl mx-auto">
              favoreat uniquely solves the trust problem in restaurant reviews
              through on-chain verification and community-driven rewards. We're
              not about payments, coupons, or supply chains - we're about making
              honest reviews have fair value.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="bg-white border border-gray-200 rounded-[16px] overflow-hidden mb-[104px]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-landing-chart-title text-gray-950">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-left text-landing-chart-title text-gray-950">
                      Traditional Web2
                    </th>
                    <th className="px-6 py-4 text-left text-landing-chart-title text-gray-950">
                      favoreat
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-landing-content-desc text-gray-950">
                      Trust Verification
                    </td>
                    <td className="px-6 py-4 text-landing-content-desc text-gray-400">
                      None - ad content dominant
                    </td>
                    <td className="px-6 py-4 text-landing-content-desc text-redorange-500">
                      EXIF + GPS + 48hr verification
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-landing-content-desc text-gray-950">
                      Reward Structure
                    </td>
                    <td className="px-6 py-4 text-landing-content-desc text-gray-400">
                      None
                    </td>
                    <td className="px-6 py-4 text-landing-content-desc text-redorange-500">
                      Points → NFT/Tokens
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-landing-content-desc text-gray-950">
                      Ecosystem
                    </td>
                    <td className="px-6 py-4 text-landing-content-desc text-gray-400">
                      Centralized platform
                    </td>
                    <td className="px-6 py-4 text-landing-content-desc text-redorange-500">
                      Base + Farcaster integration
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-landing-content-desc text-gray-950">
                      User Experience
                    </td>
                    <td className="px-6 py-4 text-landing-content-desc text-gray-400">
                      Single app focused
                    </td>
                    <td className="px-6 py-4 text-landing-content-desc text-redorange-500">
                      Frames-based social UX
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Unique Value Proposition */}
          <div className="bg-[rgba(255,69,0,0.05)] border border-[rgba(255,69,0,0.20)] rounded-[16px] p-12 max-w-[768px] mx-auto">
            <h3 className="text-landing-content text-gray-950 text-center mb-4">
              Our Unique Value Proposition
            </h3>
            <p className="text-center text-landing-content text-gray-400 mb-6 mx-auto">
              Unlike benefit platforms, fair trade apps, or payment demos,
              favoreat creates a trust-based review ecosystem where:
            </p>
            <div className="space-y-3">
              <div className="flex flex-col items-start gap-3 justify-center max-w-[546px] mx-auto">
                <div className="flex gap-3">
                  <span className="text-redorange-500 font-bold">→</span>
                  <p className="text-landing-content text-gray-950 max-w-[526px] ">
                    Users gain recognition through points, reactions, and future
                    NFT/token rewards
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-redorange-500 font-bold">→</span>
                  <p className="text-landing-content text-gray-950 max-w-[526px]">
                    48-hour EXIF verification + GPS ensures high-trust review
                    ecosystems
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-redorange-500 font-bold">→</span>
                  <p className="text-landing-content text-gray-950 max-w-[526px]">
                    Web app MVP → Mini-app structure enables fast validation and
                    scalability
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 px-6 py-16 h-[583px]">
        <div className="max-w-[1024px] mx-auto">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img
                src={"/icons/logo.svg"}
                alt="favoreat"
                className="w-[28px] h-[28px]"
              />
              <span className="text-landing-content-600 text-gray-950">
                FavorEat
              </span>
            </div>
            <p className="text-gray-400 text-landing-content">
              Where honest reviews have fair value. Building a trusted
              restaurant review ecosystem on Base and Farcaster.
            </p>
            <div className="flex gap-3">
              <a
                href="https://x.com/MATzip_official"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-[16px] transition-colors"
              >
                <img src={"/icons/x-2.svg"} alt="Twitter" className="w-8 h-8" />
              </a>
              <div className="w-10 h-10 bg-gray-100 rounded-[16px] flex items-center justify-center">
                <img
                  src={"/icons/github.svg"}
                  alt="GitHub"
                  className="w-5 h-5"
                />
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-[16px] flex items-center justify-center">
                <img src={imgIcon25} alt="LinkedIn" className="w-5 h-5" />
              </div>
            </div>
          </div>
          {/* Quote Section */}
          <div className="border-t border-b border-gray-200 pt-8 mb-12 mt-12">
            <div className="text-center max-w-[672px] mx-auto">
              <p className="text-landing-content-desc text-gray-950 mb-2 ">
                "Connecting the world through honest taste"
              </p>
              <p className="text-landing-content-desc text-gray-400 mb-[33px]">
                Everyone connects with the world through honest reviews, and
                those reviews receive fair recognition.
              </p>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-landing-content-desc text-gray-400 mb-4 md:mb-0">
              © 2025 favoreat. Built on Base & Farcaster.
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
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
