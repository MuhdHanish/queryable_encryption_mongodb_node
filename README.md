# Queryable Encryption with MongoDB in Node.js

This project demonstrates how to implement **Client-Side Field Level Encryption (CSFLE)** using MongoDB and Node.js. It uses **Queryable Encryption** to allow searching on encrypted fields, such as emails, while keeping the data secure. Sensitive fields like passwords and Social Security Numbers (SSNs) are encrypted using MongoDB's CSFLE feature.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [How It Works](#how-it-works)
- [Running the App](#running-the-app)
- [API Endpoints](#api-endpoints)
- [Schema Map](#schema-map)
- [Encryption Algorithms](#encryption-algorithms)

## Features

- **Queryable Encryption**: Perform equality queries on encrypted fields (e.g., search users by email).
- **Field-Level Encryption**: Encrypt sensitive fields such as passwords and SSNs using random encryption.
- **Local Key Management**: Supports local KMS (Key Management System) with a base64-encoded master key.
- **Secure Registration and Query**: Registers new users with encrypted fields and allows searching users by email.

## Prerequisites

Before you can run this project, ensure you have the following:

1. **MongoDB 4.2+**: You need MongoDB 4.2 or later with support for **Client-Side Field Level Encryption (CSFLE)**.
2. **Node.js**: Ensure you have Node.js installed (version 14+ is recommended).
3. **MongoDB URI**: You need access to a MongoDB instance (either locally or via MongoDB Atlas).
4. **Master Key**: A base64-encoded master key for local KMS (for demo purposes).

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/MuhdHanish/queryable_encryption_mongodb_node.git
   ```

2. Navigate into the project directory:

   ```bash
   cd queryable_encryption_mongodb_node
   ```

3. Install the required dependencies:

   ```bash
   npm install
   ```

## Environment Variables

You need to create a `.env` file in the root of the project with the following variables:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/mydb?retryWrites=true&w=majority
MASTER_KEY=your_base64_encoded_master_key
KEY_ID=your_base64_encoded_key_id  # Key ID for encrypting data fields
PORT=8000  # Port number for the server
```

### How to Generate a Master Key

For the **local KMS provider**, you need a 96-byte key. Here's an example of how you can generate it using Node.js:

```js
require('crypto').randomBytes(96).toString('base64');
```

This will output a base64-encoded 96-byte key, which you can store in your `.env` file as `MASTER_KEY`.

### How to Create a Data Key for Encryption

To generate a **KEY_ID** for your encryption key, run the following command:

```bash
node keyGenerator.js
```

This will output the key ID that you need to include in your `.env` file.

## How It Works

- **Deterministic Encryption**: Allows for queries on fields like `email`.
- **Random Encryption**: Provides stronger security for fields like `password` and `ssn`, but does not support querying.
- The app uses MongoDB's native client (`mongodb` package) to perform encryption. Mongoose is also used for schema management, but MongoClient is required for handling encrypted fields.

## Running the App

Once you've configured everything, you can start the app:

```bash
npm run start:dev
```

The app will run on the port defined in your `.env` file (default: 8000).

## API Endpoints

### Register a New User

- **URL**: `/api/register`
- **Method**: `POST`
- **Description**: Registers a new user and encrypts sensitive fields such as `email`, `password`, and `ssn`.

#### Request Body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "supersecret",
  "ssn": "123-45-6789"
}
```

#### Response:

```json
{
  "message": "User registered successfully",
  "userId": "<MongoDB Document ID>"
}
```

### Retrieve User by Email

- **URL**: `/api/user/:email`
- **Method**: `GET`
- **Description**: Retrieves a user by their email. Only non-sensitive fields are returned (i.e., password and SSN are excluded).

#### Response:

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

## Schema Map

The encryption schema used by MongoDB to encrypt specific fields:

```js
const schemaMap = {
  "queryable_encryption.users": {
    bsonType: "object",
    encryptMetadata: {
      keyId: [new Binary(Buffer.from(process.env.KEY_ID!, 'base64'), 4)]
    },
    properties: {
      email: {
        encrypt: {
          bsonType: "string",
          algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
        }
      },
      password: {
        encrypt: {
          bsonType: "string",
          algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
        }
      },
      ssn: {
        encrypt: {
          bsonType: "string",
          algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
        }
      }
    }
  }
};
```

## Encryption Algorithms:

- **Deterministic Encryption**: Used for the `email` field, allows queries on encrypted data.
- **Random Encryption**: Used for sensitive fields like `password` and `ssn`, provides stronger security but no querying capabilities.


## Feedback

If you have any feedback, please reach me at [muhammedhanish11@gmail.com](mailto:muhammedhanish11@gmail.com) or connect with me on [LinkedIn](https://www.linkedin.com/in/muhdhanish/).

## Support

Show your support by 🌟 the project!!