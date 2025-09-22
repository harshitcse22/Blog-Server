const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('./src/models/Post.model');
const User = require('./src/models/User.model');

const samplePosts = [
  {
    title: "The Future of Web Development: React 18 and Beyond",
    content: "React 18 introduces exciting new features like concurrent rendering, automatic batching, and Suspense improvements. In this comprehensive guide, we'll explore how these features can revolutionize your development workflow and create better user experiences.",
    excerpt: "Discover the game-changing features of React 18 and how they're shaping the future of web development.",
    categories: ["technology"],
    tags: ["react", "javascript", "web-development"],
    coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop",
    status: "published",
    isPublished: true,
    isFeatured: true
  },
  {
    title: "10 Must-Visit Destinations in Southeast Asia",
    content: "Southeast Asia offers incredible diversity in culture, cuisine, and landscapes. From the bustling streets of Bangkok to the serene beaches of Bali, discover the hidden gems and popular attractions that make this region a traveler's paradise.",
    excerpt: "Explore the most breathtaking destinations across Southeast Asia with our comprehensive travel guide.",
    categories: ["travel"],
    tags: ["travel", "asia", "adventure", "culture"],
    coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
    status: "published",
    isPublished: true
  },
  {
    title: "Minimalist Living: Finding Joy in Less",
    content: "Minimalism isn't just about having fewer possessions—it's about creating space for what truly matters. Learn practical strategies for decluttering your home, mind, and schedule to live a more intentional and fulfilling life.",
    excerpt: "Discover how minimalist principles can transform your lifestyle and bring more joy to your daily routine.",
    categories: ["lifestyle"],
    tags: ["minimalism", "wellness", "productivity", "mindfulness"],
    coverImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=400&fit=crop",
    status: "published",
    isPublished: true
  },
  {
    title: "The Art of Italian Pasta: From Scratch to Perfection",
    content: "Master the traditional techniques of Italian pasta making with this step-by-step guide. From selecting the right flour to achieving the perfect al dente texture, we'll cover everything you need to know to create restaurant-quality pasta at home.",
    excerpt: "Learn the secrets of authentic Italian pasta making with traditional techniques and expert tips.",
    categories: ["food"],
    tags: ["cooking", "italian", "pasta", "recipes"],
    coverImage: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=800&h=400&fit=crop",
    status: "published",
    isPublished: true
  },
  {
    title: "Building Scalable APIs with Node.js and Express",
    content: "Learn how to design and implement robust, scalable APIs using Node.js and Express. We'll cover best practices for routing, middleware, error handling, and database integration to build production-ready applications.",
    excerpt: "Master the fundamentals of building scalable and maintainable APIs with Node.js and Express.",
    categories: ["technology"],
    tags: ["nodejs", "express", "api", "backend"],
    coverImage: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=400&fit=crop",
    status: "published",
    isPublished: true
  },
  {
    title: "Digital Nomad Guide: Working Remotely from Paradise",
    content: "The digital nomad lifestyle offers freedom and adventure, but it requires careful planning and the right mindset. Discover the best destinations, essential tools, and practical tips for maintaining productivity while exploring the world.",
    excerpt: "Everything you need to know about becoming a successful digital nomad and working from anywhere.",
    categories: ["lifestyle", "travel"],
    tags: ["remote-work", "digital-nomad", "productivity", "travel"],
    coverImage: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=400&fit=crop",
    status: "published",
    isPublished: true
  },
  {
    title: "Farm-to-Table: The Rise of Sustainable Dining",
    content: "The farm-to-table movement is revolutionizing how we think about food. Explore the benefits of locally sourced ingredients, sustainable farming practices, and how restaurants are creating more environmentally conscious dining experiences.",
    excerpt: "Discover how the farm-to-table movement is changing the culinary landscape and promoting sustainability.",
    categories: ["food"],
    tags: ["sustainability", "organic", "local-food", "environment"],
    coverImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop",
    status: "published",
    isPublished: true
  },
  {
    title: "Machine Learning for Beginners: A Practical Guide",
    content: "Dive into the world of machine learning with this beginner-friendly guide. Learn the fundamental concepts, popular algorithms, and practical applications that are transforming industries worldwide.",
    excerpt: "Start your machine learning journey with practical examples and easy-to-understand concepts.",
    categories: ["technology"],
    tags: ["machine-learning", "ai", "python", "data-science"],
    coverImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop",
    status: "published",
    isPublished: true
  },
  {
    title: "Healthy Meal Prep: Save Time and Eat Better",
    content: "Transform your eating habits with strategic meal preparation. Learn how to plan, prepare, and store nutritious meals that will save you time during busy weekdays while keeping you healthy and energized.",
    excerpt: "Master the art of meal prep to maintain a healthy diet even with a busy schedule.",
    categories: ["food", "lifestyle"],
    tags: ["meal-prep", "healthy-eating", "nutrition", "time-management"],
    coverImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=400&fit=crop",
    status: "published",
    isPublished: true
  },
  {
    title: "Photography Tips: Capturing Perfect Landscapes",
    content: "Elevate your landscape photography with professional techniques and creative composition ideas. From golden hour lighting to foreground elements, learn how to create stunning images that tell a story.",
    excerpt: "Professional tips and techniques to take your landscape photography to the next level.",
    categories: ["lifestyle"],
    tags: ["photography", "landscape", "nature", "creative"],
    coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
    status: "published",
    isPublished: true
  }
];

async function seedPosts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let user = await User.findOne();
    if (!user) {
      console.log('No users found. Please create a user first.');
      return;
    }

    await Post.deleteMany({});
    console.log('Cleared existing posts');

    const postsWithAuthor = samplePosts.map(post => ({
      ...post,
      author: user._id
    }));

    const createdPosts = await Post.insertMany(postsWithAuthor);
    console.log(`Created ${createdPosts.length} sample posts`);

    console.log('Sample posts created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding posts:', error);
    process.exit(1);
  }
}

seedPosts();