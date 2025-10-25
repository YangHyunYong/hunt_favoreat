import React from "react";
import { useNavigate } from "react-router-dom";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/");
  };

  const handleViewOnFarcaster = () => {
    window.open(
      "https://farcaster.xyz/miniapps/D1uOkGuytCFh/favoreat",
      "_blank"
    );
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
                  <img
                    src={"/icons/arrow-narrow-right.svg"}
                    alt="Arrow"
                    className="w-4 h-4"
                  />
                </button>
                <button
                  onClick={handleViewOnFarcaster}
                  className="bg-white border border-gray-200 text-gray-950 px-4 py-2 rounded-[14px] text-sm font-medium transition-colors flex items-center gap-2"
                >
                  View on Farcaster
                  <img src={"/icons/out.svg"} alt="Arrow" className="w-4 h-4" />
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
                  src={"/icons/alert.svg"}
                  alt="Sponsored Content"
                  className="w-8 h-8"
                />
              </div>
              <h3 className="text-landing-content text-gray-950 mb-3">
                Sponsored Content
              </h3>
              <p className="text-gray-400">
                Web2 review platforms are flooded with paid and promotional
                reviews, making it hard to trust ratings
              </p>
            </div>

            <div className="rounded-[16px] border border-[rgba(239,68,68,0.20)] bg-[rgba(239,68,68,0.05)] p-6 h-[206px]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-[15.5px]">
                <img
                  src={"/icons/alert.svg"}
                  alt="No Recognition"
                  className="w-8 h-8"
                />
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
                <img
                  src={"/icons/alert.svg"}
                  alt="Fake Reviews"
                  className="w-8 h-8"
                />
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
                  src={"/icons/verify.svg"}
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
                <img
                  src={"/icons/reward.svg"}
                  alt="Point Rewards"
                  className="w-8 h-8"
                />
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
                <img
                  src={"/icons/marker.svg"}
                  alt="On-Chain Trust"
                  className="w-8 h-8"
                />
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
                    src={"/icons/check.svg"}
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
                    src={"/icons/check-blue.svg"}
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
                    src={"/icons/check-green.svg"}
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
                  <img
                    src={"/icons/check-purple.svg"}
                    alt="Anti-Abuse"
                    className="w-12 h-12"
                  />
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
                  src={"/icons/camera.svg"}
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
                  src={"icons/star-blue.svg"}
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
                  src={"/icons/thunder.svg"}
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
                  src={"/icons/lock.svg"}
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
                  src={"/icons/marker.svg"}
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
                  src={"/icons/community.svg"}
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
                className="absolute right-[160px] top-[10px] w-[300px] h-[500px] object-cover rounded-[16px]"
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
                  src={"/icons/search.svg"}
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
                  src={"/icons/note.svg"}
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
                  src={"/icons/share.svg"}
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
                <img
                  src={"/icons/gift.svg"}
                  alt="Earn Rewards"
                  className="w-8 h-8"
                />
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
                  <img
                    src={"/icons/check-small-red.svg"}
                    alt="Check"
                    className="w-3 h-3"
                  />
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
                  <img
                    src={"/icons/check-small-blue.svg"}
                    alt="Check"
                    className="w-3 h-3"
                  />
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
                  <img
                    src={"/icons/check-small-green.svg"}
                    alt="Check"
                    className="w-3 h-3"
                  />
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
              <a
                href="https://github.com/YangHyunYong/hunt_favoreat"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-100 rounded-[16px] flex items-center justify-center"
              >
                <img
                  src={"/icons/github.svg"}
                  alt="GitHub"
                  className="w-5 h-5"
                />
              </a>
              <a
                href="https://farcaster.xyz/miniapps/D1uOkGuytCFh/favoreat"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-100 rounded-[16px] flex items-center justify-center"
              >
                <img src={"/icons/out.svg"} alt="out" className="w-5 h-5" />
              </a>
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
                href="https://t.me/+0wdMgwmLhNUwZjM1"
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
