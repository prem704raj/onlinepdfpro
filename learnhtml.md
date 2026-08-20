# The Ultimate HTML Masterclass

Welcome to the most detailed, comprehensive guide to HTML. This guide covers everything from the absolute basics to modern HTML5 features. For every topic, you will see a **Generic Example** (how it looks in isolation) and a **Live Example from Your Site** (how it's actually used in OnlinePDFPro).

---

## 📚 Table of Contents

1. [HTML Basics](#1-html-basics)
2. [HTML Structure](#2-html-structure)
3. [Tags and Elements](#3-tags-and-elements)
4. [Attributes](#4-attributes)
5. [Headings, Paragraphs, and Text Formatting](#5-headings-paragraphs-and-text-formatting)
6. [Lists](#6-lists)
7. [Links](#7-links)
8. [Images](#8-images)
9. [Tables](#9-tables)
10. [Forms](#10-forms)
11. [Semantic HTML](#11-semantic-html)
12. [HTML5 Features](#12-html5-features)

---

## 1. HTML Basics

**What is HTML?**
HTML stands for **HyperText Markup Language**. It is the standard code used to create web pages. It is not a programming language like Python or JavaScript; instead, it is a *markup* language that tells the web browser (like Chrome or Safari) how to display text, images, and other forms of multimedia.

*   **HyperText:** Refers to links that connect web pages together.
*   **Markup:** Refers to the tags used to categorize the structure of the text.

---

## 2. HTML Structure

Every HTML document follows a strict, foundational skeleton. 

**Generic Example:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My First Webpage</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>This is my first website.</p>
</body>
</html>
```

*   `<!DOCTYPE html>`: A declaration to the browser that this is an HTML5 document.
*   `<html>`: The root element that wraps all the code.
*   `<head>`: Contains meta-information (hidden from the viewer), like the page title, CSS links, and character sets.
*   `<body>`: Contains all the visible content (text, images, buttons).

**Live Example from Your Site (`src/_includes/base.njk`):**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    {% include "partials/meta.njk" %}
    <link href="{{ '/css/style.css' | url }}" rel="stylesheet"/>
</head>
<body class="{{ bodyClass }}">
    {% include "partials/header.njk" %}
    <main>
        {{ content | safe }}
    </main>
</body>
</html>
```

---

## 3. Tags and Elements

HTML is composed of **Elements**. An element is defined by a start tag, some content, and an end tag.

**Generic Example:**
```html
<p>This is a paragraph element.</p>
```
*   `<p>` is the **opening tag**.
*   `This is a paragraph element.` is the **content**.
*   `</p>` is the **closing tag** (noted by the forward slash `/`).

**Self-Closing Tags (Empty Elements):**
Some tags do not have content inside them, so they don't need a closing tag. 
*   `<img>` (Image)
*   `<br>` (Line break)
*   `<hr>` (Horizontal line)

---

## 4. Attributes

Attributes provide extra, hidden information about an element. They are always specified in the **opening tag** and usually come in name/value pairs like: `name="value"`.

**Common Attributes:**
*   `class`: Used to assign CSS styles (e.g., `<div class="container">`)
*   `id`: A unique identifier for an element (e.g., `<div id="header">`)
*   `src`: The source file for an image or script (e.g., `<img src="cat.jpg">`)

**Live Example from Your Site:**
```html
<button class="menu-toggle" aria-label="Toggle Menu">
    <svg width="24" height="24">...</svg>
</button>
```
Here, `class="menu-toggle"` tells CSS how to style it, and `aria-label="Toggle Menu"` tells screen readers (for blind users) what the button does.

---

## 5. Headings, Paragraphs, and Text Formatting

### Headings
HTML provides 6 levels of headings, from `<h1>` (most important) to `<h6>` (least important). Search engines use headings to index the structure and content of your web pages.

**Generic Example:**
```html
<h1>Main Title</h1>
<h2>Sub Title</h2>
<h3>Section Header</h3>
```

**Live Example from Your Site (`src/index.njk`):**
```html
<h1 class="tp-hero-heading">Free Online PDF Tools</h1>
```

### Paragraphs
Paragraphs are defined with the `<p>` tag.

**Live Example from Your Site:**
```html
<p class="tp-hero-subtitle">OnlinePDFPro is your all-in-one platform...</p>
```

### Text Formatting
You can format text inside a paragraph to add emphasis.
*   `<strong>` or `<b>`: **Bold text**
*   `<em>` or `<i>`: *Italic text*
*   `<u>`: Underlined text
*   `<mark>`: Highlighted text

**Generic Example:**
```html
<p>Remember to buy <strong>milk</strong> and <em>eggs</em>.</p>
```

---

## 6. Lists

HTML has two main types of lists: Unordered (bullet points) and Ordered (numbered).

### Unordered Lists (`<ul>`)
**Generic Example:**
```html
<ul>
    <li>Apples</li>
    <li>Bananas</li>
    <li>Oranges</li>
</ul>
```

### Ordered Lists (`<ol>`)
**Generic Example:**
```html
<ol>
    <li>First step</li>
    <li>Second step</li>
    <li>Third step</li>
</ol>
```

**Live Example from Your Site (Footer Links in `src/_includes/partials/footer.njk`):**
```html
<ul class="footer-links">
    <li><a href="/about.html">About Us</a></li>
    <li><a href="/contact.html">Contact</a></li>
    <li><a href="/privacy.html">Privacy Policy</a></li>
</ul>
```

---

## 7. Links

Links (or Anchors) are the backbone of the web. They are defined with the `<a>` tag.
The `href` attribute specifies the destination URL.

**Generic Example (Absolute Link):**
```html
<a href="https://www.google.com">Visit Google</a>
```

**Generic Example (Open in New Tab):**
```html
<a href="https://www.google.com" target="_blank">Visit Google (New Tab)</a>
```

**Live Example from Your Site (Relative Link):**
```html
<a href="/tools.html" class="nav-link">All Tools</a>
```
*Note: A "relative link" like `/tools.html` keeps the user on the same website, while an "absolute link" like `https://google.com` takes them to a different site.*

---

## 8. Images

Images are added using the `<img>` tag. It requires two main attributes:
1.  `src`: The path to the image file.
2.  `alt`: Alternate text describing the image (crucial for SEO and visually impaired users).

**Generic Example:**
```html
<img src="images/dog.jpg" alt="A cute golden retriever">
```

**Live Example from Your Site (`src/_includes/partials/header.njk`):**
```html
<img src="/assets/logo.png" alt="OnlinePDFPro Logo" width="150" height="40">
```
*Note: Providing `width` and `height` prevents the page from jumping around while the image loads.*

---

## 9. Tables

Tables are used to display data in a grid (rows and columns).
*   `<table>`: Wraps the entire table.
*   `<tr>`: Table Row.
*   `<th>`: Table Header (bold text).
*   `<td>`: Table Data (standard cell).

**Generic Example:**
```html
<table>
    <tr>
        <th>Name</th>
        <th>Age</th>
    </tr>
    <tr>
        <td>John</td>
        <td>25</td>
    </tr>
    <tr>
        <td>Jane</td>
        <td>28</td>
    </tr>
</table>
```
*(Note: Tables should only be used for displaying data, NEVER for designing the layout of a web page.)*

---

## 10. Forms

Forms are how users send data to a website (logging in, searching, uploading files).
*   `<form>`: The wrapper for the form.
*   `<input>`: The most versatile form element (can be text, password, checkbox, file).
*   `<label>`: Text that describes the input.
*   `<button>`: To submit the form.

**Generic Example (Login Form):**
```html
<form action="/login-script" method="POST">
    <label for="username">Username:</label>
    <input type="text" id="username" name="username" required>
    
    <label for="pwd">Password:</label>
    <input type="password" id="pwd" name="pwd" required>
    
    <button type="submit">Login</button>
</form>
```

**Live Example from Your Site (File Upload in PDF Tools):**
```html
<div class="upload-area">
    <input type="file" id="pdf-upload" accept=".pdf" multiple>
    <label for="pdf-upload" class="upload-btn">Choose PDF Files</label>
</div>
```
*Notice `accept=".pdf"` forces the user's computer to only allow PDF files to be selected!*

---

## 11. Semantic HTML

In the old days, developers used `<div>` (a generic container) for everything. **Semantic HTML** introduces tags with meaning, which helps Google and screen readers understand your layout.

**Key Semantic Tags:**
*   `<header>`: The introductory content (usually contains the logo and navigation).
*   `<nav>`: The navigation menu.
*   `<main>`: The primary, dominant content of the page.
*   `<section>`: A thematic grouping of content.
*   `<article>`: An independent, self-contained piece of content (like a blog post).
*   `<footer>`: The bottom of the page.

**Live Example from Your Site (`src/_includes/base.njk`):**
Instead of using `<div class="header">` and `<div class="main">`, your site correctly uses Semantic HTML:
```html
<body>
    <header class="header">
        <!-- Logo and Nav go here -->
    </header>
    
    <main id="main">
        <!-- The specific tool or page content goes here -->
    </main>
    
    <footer class="footer">
        <!-- Copyright and footer links go here -->
    </footer>
</body>
```

---

## 12. HTML5 Features

HTML5 is the latest version of HTML. It introduced massive improvements, eliminating the need for heavy plugins like Adobe Flash.

### 1. Native Video and Audio
You can now play media directly in the browser.

**Generic Example:**
```html
<video width="320" height="240" controls>
    <source src="movie.mp4" type="video/mp4">
    Your browser does not support the video tag.
</video>
```

### 2. Local Storage
HTML5 allowed websites to save data directly in the browser's memory using JavaScript (`window.localStorage`), rather than relying on cookies or databases.

**Live Example from Your Site (`history.html`):**
Your entire "History" feature runs on HTML5 Local Storage! When you use a tool, JavaScript saves it to your browser. When you visit the history page, it displays it.

### 3. Canvas and SVG
HTML5 introduced `<canvas>` (for drawing graphics via JavaScript) and `<svg>` (for drawing vector shapes mathematically in HTML).

**Live Example from Your Site (SVG):**
Your site avoids slow-loading `.png` icons by using pure HTML5 SVGs. 
```html
<svg class="feature-icon" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10..."></path>
</svg>
```

---
*End of Masterclass. Keep this document as your ultimate reference cheat-sheet while building and modifying your website!*
