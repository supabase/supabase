"use strict";

const fs = require("fs");

const TITLE_PATTERN =
  /^(?<prefix>[^:!(]+)(?<package>\([^)]+\))?(?<breaking>[!])?:.+$/;
const RELEASE_AS_DIRECTIVE = /^\s*Release-As:/im;
const BREAKING_CHANGE_DIRECTIVE = /^\s*BREAKING[ \t]+CHANGE:/im;

const ALLOWED_CONVENTIONAL_COMMIT_PREFIXES = [
  "revert",
  "feat",
  "fix",
  "ci",
  "docs",
  "chore",
];

const object = process.argv[2];
const payload = JSON.parse(fs.readFileSync(process.argv[3], "utf-8"));

let validate = [];

if (object === "pr") {
  validate.push({
    title: payload.pull_request.title,
    content: payload.pull_request.body,
  });
} else if (object === "push") {
  validate.push(
    ...payload.commits
      .map((commit) => ({
        title: commit.message.split("\n")[0],
        content: commit.message,
      }))
      .filter(({ title }) => !title.startsWith("Merge branch ") && !title.startsWith("Revert ")),
  );
} else {
  console.error(
    `Unknown object for first argument "${object}", use 'pr' or 'push'.`,
  );
  process.exit(0);
}

let failed = false;

validate.forEach((payload) => {
  if (payload.title) {
    const match = payload.title.match(TITLE_PATTERN);
    if (!match) {
      return
    }

    const { groups } = match

    if (groups) {
      if (groups.breaking) {
        console.error(
          `PRs are not allowed to declare breaking changes at this stage of the project. Please remove the ! in your PR title or commit message and adjust the functionality to be backward compatible.`,
        );
        failed = true;
      }

      if (
        !ALLOWED_CONVENTIONAL_COMMIT_PREFIXES.find(
          (prefix) => prefix === groups.prefix,
        )
      ) {
        console.error(
          `PR (or a commit in it) is using a disallowed conventional commit prefix ("${groups.prefix}"). Only ${ALLOWED_CONVENTIONAL_COMMIT_PREFIXES.join(", ")} are allowed. Make sure the prefix is lowercase!`,
        );
        failed = true;
      }

      if (groups.package && groups.prefix !== "chore") {
        console.warn(
          "Avoid using package specifications in PR titles or commits except for the `chore` prefix.",
        );
      }
    } else {
      console.error(
        "PR or commit title must match conventional commit structure.",
      );
      failed = true;
    }
  }

  if (payload.content) {
    if (payload.content.match(RELEASE_AS_DIRECTIVE)) {
      console.error(
        "PR descriptions or commit messages must not contain Release-As conventional commit directives.",
      );
      failed = true;
    }

    if (payload.content.match(BREAKING_CHANGE_DIRECTIVE)) {
      console.error(
        "PR descriptions or commit messages must not contain a BREAKING CHANGE conventional commit directive. Please adjust the functionality to be backward compatible.",
      );
      failed = true;
    }
  }
});

if (failed) {
  process.exit(1);
}

process.exit(0);
