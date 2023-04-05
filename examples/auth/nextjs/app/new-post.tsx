"use client";

import { FormEvent } from "react";

export default function NewPost() {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { content } = Object.fromEntries(new FormData(e.currentTarget));

    await fetch("http://localhost:3000/api/posts", {
      method: "post",
      body: JSON.stringify({ content }),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="content" />
    </form>
  );
}
