---
title: 'Storage'
description: 'Supabase Storage'
---

# Storage

## Overview

Supabase Storage makes it simple to store and serve large files.

### Files

Files can be any sort of media file. This includes images, GIFs, and videos. It is best practice to store files outside of your database because of their sizes.

### Folders

Folders are a way to organize your files (just like on your computer). There is no right or wrong way to organize your files. You can store them in whichever folder structure suits your project.

### Buckets

Buckets are distinct containers for files and folders. You can think of them like "super folders". Generally you would create distinct buckets for different Security and Access Rules. For example, you might keep all public files in a "public" bucket, and other files that require logged-in access in a "restricted" bucket.

## Getting started#

This is a quick guide that shows the basic functionality of Supabase Storage. Find a full [example application in GitHub](https://github.com/supabase/supabase/edit/master/examples/nextjs-ts-user-management), which you can deploy yourself.

### Create a bucket

You can create a bucket using the Supabase Dashboard. Since the storage is interoperable with your Postgres database, you can also use SQL or our client libraries. Here we create a bucket called "avatars":
