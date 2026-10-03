// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { promises as fsPromises } from "node:fs";

export const access = fsPromises.access;
export const constants = fsPromises.constants;
export const copyFile = fsPromises.copyFile;
export const open = fsPromises.open;
export const opendir = fsPromises.opendir;
export const rename = fsPromises.rename;
export const truncate = fsPromises.truncate;
export const rm = fsPromises.rm;
export const rmdir = fsPromises.rmdir;
export const mkdir = fsPromises.mkdir;
export const readdir = fsPromises.readdir;
export const readlink = fsPromises.readlink;
export const symlink = fsPromises.symlink;
export const lstat = fsPromises.lstat;
export const stat = fsPromises.stat;
export const fstat = fsPromises.fstat;
export const link = fsPromises.link;
export const unlink = fsPromises.unlink;
export const chmod = fsPromises.chmod;
// export const lchmod = fs.lchmod;
// export const lchown = fs.lchown;
export const chown = fsPromises.chown;
export const utimes = fsPromises.utimes;
// export const lutimes = fs.lutimes;
export const realpath = fsPromises.realpath;
export const mkdtemp = fsPromises.mkdtemp;
export const writeFile = fsPromises.writeFile;
export const appendFile = fsPromises.appendFile;
export const readFile = fsPromises.readFile;
export const watch = fsPromises.watch;
export const cp = fsPromises.cp;

export default fsPromises;
