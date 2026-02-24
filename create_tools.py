import os

# Read the text-to-audio template parts
head = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Text to Speech & PDF to Audio Online Free | Online PDF Pro</title>
  <meta name="description" content="Convert text or PDF to audio online for free. Listen to documents and text with 50+ voices, multiple languages.">
  <meta name="keywords" content="text to speech, pdf to audio, text to audio, listen to pdf, tts online free, text to mp3, read aloud">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://onlinepdfpro.com/text-to-audio.html">
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/tools.css">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
'''

# Read the user's original file if it exists and use it, otherwise build from scratch
# We'll use the user's provided HTML but fix paths
original_path = 'text-to-audio.html'

# Read the full content from the user's message - we'll construct it
print("Creating text-to-audio.html...")
print("Creating pdf-bookmark.html...")
print("Done - files will be created by the next script")
