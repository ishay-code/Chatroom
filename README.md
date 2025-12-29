ishay heller 

# Chatroom Web Application

## Project Overview
This is a full-stack web application implementing a chatroom system 
with user registration and authentication functionalities.

### User Registration
- Two-step registration process, first(email, first name, second name) second(choose a password)
- Client-side validation using HTML5
- Server-side email uniqueness check
- 30-second cookie-based temporary storage of registration information

### Login System
- Secure login mechanism
- Session management
- Automatic redirection for logged-in/logged-out states

### Chatroom Functionality
- Only accessible to authenticated users
- Real-time message updates (every 10 seconds)
- Message sending, editing, and deletion
- Search functionality within messages

## Installation

1. Download the zip and extract it
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the application:
   run the www file in the bin directory



