// ============================================================
// MEMORY CONFIGURATION
// ------------------------------------------------------------
// Add your real memories here. Nothing in this file is
// invented — fill in what actually happened. Anything left
// as a placeholder will show as "[ADD ... HERE]" on the site
// so you never forget to replace it before sending this.
//
// You can add as many memories as you like — slide 3 will
// show up to two of them (set `feature: true` on the ones
// you want to appear there), and any others can be wired
// into later slides if you want.
// ============================================================

const memories = [
  {
    date: "2023-11-04",              // e.g. "2023-03-14"
    title: "Everything started with this note...", // e.g. "The day we met"
    description: "The eyes that made me fall in love with you", // a sentence or two, in your own words
    image: "Kandamma/Screenshot_2023-11-04-22-09-19-157_com.instagram.android.jpg",      // drop your photo in /frontend/images/
    feature: true
  },
  {
    date: "YYYY-MM-DD",
    title: "The eyes that made me fall in love with you <3 ", // e.g. "The day we met"
    description: "The eyes that made me fall in love with you", // a sentence or two, in your own words
    image: "Kandamma/IMG_20260607_172125_413.jpg", 
    feature: true
  }
  ,
  {
    date: "2024-02-14",
    title: "The gift I will cherish forever❤️.They have the safest spot in my life and heart",
    description: "That call where we talked until dawn",
    image: "Kandamma/IMG20260823004330_20260823004412.jpg",
    feature: true
  },
  {
    date: "2024-06-07",
    title: "The cutest pic of you on my phone",
    description: "You sent that goofy selfie and I couldn't stop smiling",
    image: "Kandamma/IMG_20260607_172212_937.jpg",
    feature: true
  }
  ,
  {
    date: "2024-06-07",
    title: "Do you remember the birthday when I called to wish you?",
    description: "You sent that goofy selfie and I couldn't stop smiling",
    image: "Kandamma/IMG_20260607_172142_511.jpg",
    feature: true
  }
  ,
  {
    date: "2024-06-07",
    title: "A new collection to my favourite folder.... COOL AS EVER😎",
    description: "You sent that goofy selfie and I couldn't stop smiling",
    image: "Kandamma/IMG_20260808_222024_155.jpg",
    feature: true
  }
  
  // Add more memory objects here if you want.
];

// The single photo for the opening slide (slide 1). Optional —
// leave "image" as null if you'd rather not include one there.
const openingPhoto = {
  image: "Kandamma/file_00000000d7f871fab660cf4f0de4c5db.png", // e.g. "images/opening.jpg"
  caption: "Mera Rasmalaiiiiii😘"
  
};


// The photo used on the "hug" slide (slide 4). This is the
// most emotionally important image on the site — pick the
// one photo from that day, if you have it.
const hugPhoto = {
  image: "Kandamma/hug.jpg", // e.g. "images/hug.jpg"
  caption: ""
};

// A quieter background-ish photo for slide 5 ("time passed").
const timePassedPhoto = {
  image: "Kandamma/IMG20260823021226_20260823021256.jpg", // e.g. "images/time-passed.jpg"
  caption: "Youu are myy everythingggg❤️\nI wanted to recreate the masterpiece."
};

// Exported for app.js to use.
window.SITE_DATA = { memories, openingPhoto, hugPhoto, timePassedPhoto };
