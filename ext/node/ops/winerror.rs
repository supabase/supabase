// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/* Copyright Joyent, Inc. and other Node contributors. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

// This module ports:
// - https://github.com/libuv/libuv/blob/master/src/win/error.c
#![allow(unused)]

use deno_core::op2;

#[op2]
#[string]
pub fn op_node_sys_to_uv_error(err: i32) -> String {
  let uv_err = match err {
    ERROR_ACCESS_DENIED => "EACCES",
    ERROR_NOACCESS => "EACCES",
    WSAEACCES => "EACCES",
    ERROR_CANT_ACCESS_FILE => "EACCES",
    ERROR_ADDRESS_ALREADY_ASSOCIATED => "EADDRINUSE",
    WSAEADDRINUSE => "EADDRINUSE",
    WSAEADDRNOTAVAIL => "EADDRNOTAVAIL",
    WSAEAFNOSUPPORT => "EAFNOSUPPORT",
    WSAEWOULDBLOCK => "EAGAIN",
    WSAEALREADY => "EALREADY",
    ERROR_INVALID_FLAGS => "EBADF",
    ERROR_INVALID_HANDLE => "EBADF",
    ERROR_LOCK_VIOLATION => "EBUSY",
    ERROR_PIPE_BUSY => "EBUSY",
    ERROR_SHARING_VIOLATION => "EBUSY",
    ERROR_OPERATION_ABORTED => "ECANCELED",
    WSAEINTR => "ECANCELED",
    ERROR_NO_UNICODE_TRANSLATION => "ECHARSET",
    ERROR_CONNECTION_ABORTED => "ECONNABORTED",
    WSAECONNABORTED => "ECONNABORTED",
    ERROR_CONNECTION_REFUSED => "ECONNREFUSED",
    WSAECONNREFUSED => "ECONNREFUSED",
    ERROR_NETNAME_DELETED => "ECONNRESET",
    WSAECONNRESET => "ECONNRESET",
    ERROR_ALREADY_EXISTS => "EEXIST",
    ERROR_FILE_EXISTS => "EEXIST",
    ERROR_BUFFER_OVERFLOW => "EFAULT",
    WSAEFAULT => "EFAULT",
    ERROR_HOST_UNREACHABLE => "EHOSTUNREACH",
    WSAEHOSTUNREACH => "EHOSTUNREACH",
    ERROR_INSUFFICIENT_BUFFER => "EINVAL",
    ERROR_INVALID_DATA => "EINVAL",
    ERROR_INVALID_NAME => "ENOENT",
    ERROR_INVALID_PARAMETER => "EINVAL",
    WSAEINVAL => "EINVAL",
    WSAEPFNOSUPPORT => "EINVAL",
    ERROR_NOT_A_REPARSE_POINT => "EINVAL",
    ERROR_BEGINNING_OF_MEDIA => "EIO",
    ERROR_BUS_RESET => "EIO",
    ERROR_CRC => "EIO",
    ERROR_DEVICE_DOOR_OPEN => "EIO",
    ERROR_DEVICE_REQUIRES_CLEANING => "EIO",
    ERROR_DISK_CORRUPT => "EIO",
    ERROR_EOM_OVERFLOW => "EIO",
    ERROR_FILEMARK_DETECTED => "EIO",
    ERROR_GEN_FAILURE => "EIO",
    ERROR_INVALID_BLOCK_LENGTH => "EIO",
    ERROR_IO_DEVICE => "EIO",
    ERROR_NO_DATA_DETECTED => "EIO",
    ERROR_NO_SIGNAL_SENT => "EIO",
    ERROR_OPEN_FAILED => "EIO",
    ERROR_SETMARK_DETECTED => "EIO",
    ERROR_SIGNAL_REFUSED => "EIO",
    WSAEISCONN => "EISCONN",
    ERROR_CANT_RESOLVE_FILENAME => "ELOOP",
    ERROR_TOO_MANY_OPEN_FILES => "EMFILE",
    WSAEMFILE => "EMFILE",
    WSAEMSGSIZE => "EMSGSIZE",
    ERROR_FILENAME_EXCED_RANGE => "ENAMETOOLONG",
    ERROR_NETWORK_UNREACHABLE => "ENETUNREACH",
    WSAENETUNREACH => "ENETUNREACH",
    WSAENOBUFS => "ENOBUFS",
    ERROR_BAD_PATHNAME => "ENOENT",
    ERROR_DIRECTORY => "ENOTDIR",
    ERROR_ENVVAR_NOT_FOUND => "ENOENT",
    ERROR_FILE_NOT_FOUND => "ENOENT",
    ERROR_INVALID_DRIVE => "ENOENT",
    ERROR_INVALID_REPARSE_DATA => "ENOENT",
    ERROR_MOD_NOT_FOUND => "ENOENT",
    ERROR_PATH_NOT_FOUND => "ENOENT",
    WSAHOST_NOT_FOUND => "ENOENT",
    WSANO_DATA => "ENOENT",
    ERROR_NOT_ENOUGH_MEMORY => "ENOMEM",
    ERROR_OUTOFMEMORY => "ENOMEM",
    ERROR_CANNOT_MAKE => "ENOSPC",
    ERROR_DISK_FULL => "ENOSPC",
    ERROR_EA_TABLE_FULL => "ENOSPC",
    ERROR_END_OF_MEDIA => "ENOSPC",
    ERROR_HANDLE_DISK_FULL => "ENOSPC",
    ERROR_NOT_CONNECTED => "ENOTCONN",
    WSAENOTCONN => "ENOTCONN",
    ERROR_DIR_NOT_EMPTY => "ENOTEMPTY",
    WSAENOTSOCK => "ENOTSOCK",
    ERROR_NOT_SUPPORTED => "ENOTSUP",
    ERROR_BROKEN_PIPE => "EOF",
    ERROR_PRIVILEGE_NOT_HELD => "EPERM",
    ERROR_BAD_PIPE => "EPIPE",
    ERROR_NO_DATA => "EPIPE",
    ERROR_PIPE_NOT_CONNECTED => "EPIPE",
    WSAESHUTDOWN => "EPIPE",
    WSAEPROTONOSUPPORT => "EPROTONOSUPPORT",
    ERROR_WRITE_PROTECT => "EROFS",
    ERROR_SEM_TIMEOUT => "ETIMEDOUT",
    WSAETIMEDOUT => "ETIMEDOUT",
    ERROR_NOT_SAME_DEVICE => "EXDEV",
    ERROR_INVALID_FUNCTION => "EISDIR",
    ERROR_META_EXPANSION_TOO_LONG => "E2BIG",
    WSAESOCKTNOSUPPORT => "ESOCKTNOSUPPORT",
    _ => "UNKNOWN",
  };
  uv_err.to_string()
}

/*++

Copyright (c) Microsoft Corporation. All rights reserved.

You may only use this code if you agree to the terms of the Windows Research Kernel Source Code License agreement (see License.txt).
If you do not agree to the terms, do not use the code.

Module:

    winderror.h

Abstract:

    Win32 API functions

--*/

// This module ports:
// - https://raw.githubusercontent.com/mic101/windows/master/WRK-v1.2/public/sdk/inc/winerror.h

// MessageId: ERROR_SUCCESS
//
// MessageText:
//
//  The operation completed successfully.
//
pub const ERROR_SUCCESS: i32 = 0;

//
// MessageId: ERROR_INVALID_FUNCTION
//
// MessageText:
//
//  Incorrect function.
//
pub const ERROR_INVALID_FUNCTION: i32 = 1; // dderror

//
// MessageId: ERROR_FILE_NOT_FOUND
//
// MessageText:
//
//  The system cannot find the file specified.
//
pub const ERROR_FILE_NOT_FOUND: i32 = 2;

//
// MessageId: ERROR_PATH_NOT_FOUND
//
// MessageText:
//
//  The system cannot find the path specified.
//
pub const ERROR_PATH_NOT_FOUND: i32 = 3;

//
// MessageId: ERROR_TOO_MANY_OPEN_FILES
//
// MessageText:
//
//  The system cannot open the file.
//
pub const ERROR_TOO_MANY_OPEN_FILES: i32 = 4;

//
// MessageId: ERROR_ACCESS_DENIED
//
// MessageText:
//
//  Access is denied.
//
pub const ERROR_ACCESS_DENIED: i32 = 5;

//
// MessageId: ERROR_INVALID_HANDLE
//
// MessageText:
//
//  The handle is invalid.
//
pub const ERROR_INVALID_HANDLE: i32 = 6;

//
// MessageId: ERROR_ARENA_TRASHED
//
// MessageText:
//
//  The storage control blocks were destroyed.
//
pub const ERROR_ARENA_TRASHED: i32 = 7;

//
// MessageId: ERROR_NOT_ENOUGH_MEMORY
//
// MessageText:
//
//  Not enough storage is available to process this command.
//
pub const ERROR_NOT_ENOUGH_MEMORY: i32 = 8; // dderror

//
// MessageId: ERROR_INVALID_BLOCK
//
// MessageText:
//
//  The storage control block address is invalid.
//
pub const ERROR_INVALID_BLOCK: i32 = 9;

//
// MessageId: ERROR_BAD_ENVIRONMENT
//
// MessageText:
//
//  The environment is incorrect.
//
pub const ERROR_BAD_ENVIRONMENT: i32 = 10;

//
// MessageId: ERROR_BAD_FORMAT
//
// MessageText:
//
//  An attempt was made to load a program with an incorrect format.
//
pub const ERROR_BAD_FORMAT: i32 = 11;

//
// MessageId: ERROR_INVALID_ACCESS
//
// MessageText:
//
//  The access code is invalid.
//
pub const ERROR_INVALID_ACCESS: i32 = 12;

//
// MessageId: ERROR_INVALID_DATA
//
// MessageText:
//
//  The data is invalid.
//
pub const ERROR_INVALID_DATA: i32 = 13;

//
// MessageId: ERROR_OUTOFMEMORY
//
// MessageText:
//
//  Not enough storage is available to complete this operation.
//
pub const ERROR_OUTOFMEMORY: i32 = 14;

//
// MessageId: ERROR_INVALID_DRIVE
//
// MessageText:
//
//  The system cannot find the drive specified.
//
pub const ERROR_INVALID_DRIVE: i32 = 15;

//
// MessageId: ERROR_CURRENT_DIRECTORY
//
// MessageText:
//
//  The directory cannot be removed.
//
pub const ERROR_CURRENT_DIRECTORY: i32 = 16;

//
// MessageId: ERROR_NOT_SAME_DEVICE
//
// MessageText:
//
//  The system cannot move the file to a different disk drive.
//
pub const ERROR_NOT_SAME_DEVICE: i32 = 17;

//
// MessageId: ERROR_NO_MORE_FILES
//
// MessageText:
//
//  There are no more files.
//
pub const ERROR_NO_MORE_FILES: i32 = 18;

//
// MessageId: ERROR_WRITE_PROTECT
//
// MessageText:
//
//  The media is write protected.
//
pub const ERROR_WRITE_PROTECT: i32 = 19;

//
// MessageId: ERROR_BAD_UNIT
//
// MessageText:
//
//  The system cannot find the device specified.
//
pub const ERROR_BAD_UNIT: i32 = 20;

//
// MessageId: ERROR_NOT_READY
//
// MessageText:
//
//  The device is not ready.
//
pub const ERROR_NOT_READY: i32 = 21;

//
// MessageId: ERROR_BAD_COMMAND
//
// MessageText:
//
//  The device does not recognize the command.
//
pub const ERROR_BAD_COMMAND: i32 = 22;

//
// MessageId: ERROR_CRC
//
// MessageText:
//
//  Data error (cyclic redundancy check).
//
pub const ERROR_CRC: i32 = 23;

//
// MessageId: ERROR_BAD_LENGTH
//
// MessageText:
//
//  The program issued a command but the command length is incorrect.
//
pub const ERROR_BAD_LENGTH: i32 = 24;

//
// MessageId: ERROR_SEEK
//
// MessageText:
//
//  The drive cannot locate a specific area or track on the disk.
//
pub const ERROR_SEEK: i32 = 25;

//
// MessageId: ERROR_NOT_DOS_DISK
//
// MessageText:
//
//  The specified disk or diskette cannot be accessed.
//
pub const ERROR_NOT_DOS_DISK: i32 = 26;

//
// MessageId: ERROR_SECTOR_NOT_FOUND
//
// MessageText:
//
//  The drive cannot find the sector requested.
//
pub const ERROR_SECTOR_NOT_FOUND: i32 = 27;

//
// MessageId: ERROR_OUT_OF_PAPER
//
// MessageText:
//
//  The printer is out of paper.
//
pub const ERROR_OUT_OF_PAPER: i32 = 28;

//
// MessageId: ERROR_WRITE_FAULT
//
// MessageText:
//
//  The system cannot write to the specified device.
//
pub const ERROR_WRITE_FAULT: i32 = 29;

//
// MessageId: ERROR_READ_FAULT
//
// MessageText:
//
//  The system cannot read from the specified device.
//
pub const ERROR_READ_FAULT: i32 = 30;

//
// MessageId: ERROR_GEN_FAILURE
//
// MessageText:
//
//  A device attached to the system is not functioning.
//
pub const ERROR_GEN_FAILURE: i32 = 31;

//
// MessageId: ERROR_SHARING_VIOLATION
//
// MessageText:
//
//  The process cannot access the file because it is being used by another process.
//
pub const ERROR_SHARING_VIOLATION: i32 = 32;

//
// MessageId: ERROR_LOCK_VIOLATION
//
// MessageText:
//
//  The process cannot access the file because another process has locked a portion of the file.
//
pub const ERROR_LOCK_VIOLATION: i32 = 33;

//
// MessageId: ERROR_WRONG_DISK
//
// MessageText:
//
//  The wrong diskette is in the drive.
//  Insert %2 (Volume Serial Number: %3) into drive %1.
//
pub const ERROR_WRONG_DISK: i32 = 34;

//
// MessageId: ERROR_SHARING_BUFFER_EXCEEDED
//
// MessageText:
//
//  Too many files opened for sharing.
//
pub const ERROR_SHARING_BUFFER_EXCEEDED: i32 = 36;

//
// MessageId: ERROR_HANDLE_EOF
//
// MessageText:
//
//  Reached the end of the file.
//
pub const ERROR_HANDLE_EOF: i32 = 38;

//
// MessageId: ERROR_HANDLE_DISK_FULL
//
// MessageText:
//
//  The disk is full.
//
pub const ERROR_HANDLE_DISK_FULL: i32 = 39;

//
// MessageId: ERROR_NOT_SUPPORTED
//
// MessageText:
//
//  The request is not supported.
//
pub const ERROR_NOT_SUPPORTED: i32 = 50;

//
// MessageId: ERROR_REM_NOT_LIST
//
// MessageText:
//
//  Windows cannot find the network path. Verify that the network path is correct and the destination computer is not busy or turned off. If Windows still cannot find the network path, contact your network administrator.
//
pub const ERROR_REM_NOT_LIST: i32 = 51;

//
// MessageId: ERROR_DUP_NAME
//
// MessageText:
//
//  You were not connected because a duplicate name exists on the network. Go to System in Control Panel to change the computer name and try again.
//
pub const ERROR_DUP_NAME: i32 = 52;

//
// MessageId: ERROR_BAD_NETPATH
//
// MessageText:
//
//  The network path was not found.
//
pub const ERROR_BAD_NETPATH: i32 = 53;

//
// MessageId: ERROR_NETWORK_BUSY
//
// MessageText:
//
//  The network is busy.
//
pub const ERROR_NETWORK_BUSY: i32 = 54;

//
// MessageId: ERROR_DEV_NOT_EXIST
//
// MessageText:
//
//  The specified network resource or device is no longer available.
//
pub const ERROR_DEV_NOT_EXIST: i32 = 55; // dderror

//
// MessageId: ERROR_TOO_MANY_CMDS
//
// MessageText:
//
//  The network BIOS command limit has been reached.
//
pub const ERROR_TOO_MANY_CMDS: i32 = 56;

//
// MessageId: ERROR_ADAP_HDW_ERR
//
// MessageText:
//
//  A network adapter hardware error occurred.
//
pub const ERROR_ADAP_HDW_ERR: i32 = 57;

//
// MessageId: ERROR_BAD_NET_RESP
//
// MessageText:
//
//  The specified server cannot perform the requested operation.
//
pub const ERROR_BAD_NET_RESP: i32 = 58;

//
// MessageId: ERROR_UNEXP_NET_ERR
//
// MessageText:
//
//  An unexpected network error occurred.
//
pub const ERROR_UNEXP_NET_ERR: i32 = 59;

//
// MessageId: ERROR_BAD_REM_ADAP
//
// MessageText:
//
//  The remote adapter is not compatible.
//
pub const ERROR_BAD_REM_ADAP: i32 = 60;

//
// MessageId: ERROR_PRINTQ_FULL
//
// MessageText:
//
//  The printer queue is full.
//
pub const ERROR_PRINTQ_FULL: i32 = 61;

//
// MessageId: ERROR_NO_SPOOL_SPACE
//
// MessageText:
//
//  Space to store the file waiting to be printed is not available on the server.
//
pub const ERROR_NO_SPOOL_SPACE: i32 = 62;

//
// MessageId: ERROR_PRINT_CANCELLED
//
// MessageText:
//
//  Your file waiting to be printed was deleted.
//
pub const ERROR_PRINT_CANCELLED: i32 = 63;

//
// MessageId: ERROR_NETNAME_DELETED
//
// MessageText:
//
//  The specified network name is no longer available.
//
pub const ERROR_NETNAME_DELETED: i32 = 64;

//
// MessageId: ERROR_NETWORK_ACCESS_DENIED
//
// MessageText:
//
//  Network access is denied.
//
pub const ERROR_NETWORK_ACCESS_DENIED: i32 = 65;

//
// MessageId: ERROR_BAD_DEV_TYPE
//
// MessageText:
//
//  The network resource type is not correct.
//
pub const ERROR_BAD_DEV_TYPE: i32 = 66;

//
// MessageId: ERROR_BAD_NET_NAME
//
// MessageText:
//
//  The network name cannot be found.
//
pub const ERROR_BAD_NET_NAME: i32 = 67;

//
// MessageId: ERROR_TOO_MANY_NAMES
//
// MessageText:
//
//  The name limit for the local computer network adapter card was exceeded.
//
pub const ERROR_TOO_MANY_NAMES: i32 = 68;

//
// MessageId: ERROR_TOO_MANY_SESS
//
// MessageText:
//
//  The network BIOS session limit was exceeded.
//
pub const ERROR_TOO_MANY_SESS: i32 = 69;

//
// MessageId: ERROR_SHARING_PAUSED
//
// MessageText:
//
//  The remote server has been paused or is in the process of being started.
//
pub const ERROR_SHARING_PAUSED: i32 = 70;

//
// MessageId: ERROR_REQ_NOT_ACCEP
//
// MessageText:
//
//  No more connections can be made to this remote computer at this time because there are already as many connections as the computer can accept.
//
pub const ERROR_REQ_NOT_ACCEP: i32 = 71;

//
// MessageId: ERROR_REDIR_PAUSED
//
// MessageText:
//
//  The specified printer or disk device has been paused.
//
pub const ERROR_REDIR_PAUSED: i32 = 72;

//
// MessageId: ERROR_FILE_EXISTS
//
// MessageText:
//
//  The file exists.
//
pub const ERROR_FILE_EXISTS: i32 = 80;

//
// MessageId: ERROR_CANNOT_MAKE
//
// MessageText:
//
//  The directory or file cannot be created.
//
pub const ERROR_CANNOT_MAKE: i32 = 82;

//
// MessageId: ERROR_FAIL_I24
//
// MessageText:
//
//  Fail on INT 24.
//
pub const ERROR_FAIL_I24: i32 = 83;

//
// MessageId: ERROR_OUT_OF_STRUCTURES
//
// MessageText:
//
//  Storage to process this request is not available.
//
pub const ERROR_OUT_OF_STRUCTURES: i32 = 84;

//
// MessageId: ERROR_ALREADY_ASSIGNED
//
// MessageText:
//
//  The local device name is already in use.
//
pub const ERROR_ALREADY_ASSIGNED: i32 = 85;

//
// MessageId: ERROR_INVALID_PASSWORD
//
// MessageText:
//
//  The specified network password is not correct.
//
pub const ERROR_INVALID_PASSWORD: i32 = 86;

//
// MessageId: ERROR_INVALID_PARAMETER
//
// MessageText:
//
//  The parameter is incorrect.
//
pub const ERROR_INVALID_PARAMETER: i32 = 87; // dderror

//
// MessageId: ERROR_NET_WRITE_FAULT
//
// MessageText:
//
//  A write fault occurred on the network.
//
pub const ERROR_NET_WRITE_FAULT: i32 = 88;

//
// MessageId: ERROR_NO_PROC_SLOTS
//
// MessageText:
//
//  The system cannot start another process at this time.
//
pub const ERROR_NO_PROC_SLOTS: i32 = 89;

//
// MessageId: ERROR_TOO_MANY_SEMAPHORES
//
// MessageText:
//
//  Cannot create another system semaphore.
//
pub const ERROR_TOO_MANY_SEMAPHORES: i32 = 100;

//
// MessageId: ERROR_EXCL_SEM_ALREADY_OWNED
//
// MessageText:
//
//  The exclusive semaphore is owned by another process.
//
pub const ERROR_EXCL_SEM_ALREADY_OWNED: i32 = 101;

//
// MessageId: ERROR_SEM_IS_SET
//
// MessageText:
//
//  The semaphore is set and cannot be closed.
//
pub const ERROR_SEM_IS_SET: i32 = 102;

//
// MessageId: ERROR_TOO_MANY_SEM_REQUESTS
//
// MessageText:
//
//  The semaphore cannot be set again.
//
pub const ERROR_TOO_MANY_SEM_REQUESTS: i32 = 103;

//
// MessageId: ERROR_INVALID_AT_INTERRUPT_TIME
//
// MessageText:
//
//  Cannot request exclusive semaphores at interrupt time.
//
pub const ERROR_INVALID_AT_INTERRUPT_TIME: i32 = 104;

//
// MessageId: ERROR_SEM_OWNER_DIED
//
// MessageText:
//
//  The previous ownership of this semaphore has ended.
//
pub const ERROR_SEM_OWNER_DIED: i32 = 105;

//
// MessageId: ERROR_SEM_USER_LIMIT
//
// MessageText:
//
//  Insert the diskette for drive %1.
//
pub const ERROR_SEM_USER_LIMIT: i32 = 106;

//
// MessageId: ERROR_DISK_CHANGE
//
// MessageText:
//
//  The program stopped because an alternate diskette was not inserted.
//
pub const ERROR_DISK_CHANGE: i32 = 107;

//
// MessageId: ERROR_DRIVE_LOCKED
//
// MessageText:
//
//  The disk is in use or locked by another process.
//
pub const ERROR_DRIVE_LOCKED: i32 = 108;

//
// MessageId: ERROR_BROKEN_PIPE
//
// MessageText:
//
//  The pipe has been ended.
//
pub const ERROR_BROKEN_PIPE: i32 = 109;

//
// MessageId: ERROR_OPEN_FAILED
//
// MessageText:
//
//  The system cannot open the device or file specified.
//
pub const ERROR_OPEN_FAILED: i32 = 110;

//
// MessageId: ERROR_BUFFER_OVERFLOW
//
// MessageText:
//
//  The file name is too long.
//
pub const ERROR_BUFFER_OVERFLOW: i32 = 111;

//
// MessageId: ERROR_DISK_FULL
//
// MessageText:
//
//  There is not enough space on the disk.
//
pub const ERROR_DISK_FULL: i32 = 112;

//
// MessageId: ERROR_NO_MORE_SEARCH_HANDLES
//
// MessageText:
//
//  No more internal file identifiers available.
//
pub const ERROR_NO_MORE_SEARCH_HANDLES: i32 = 113;

//
// MessageId: ERROR_INVALID_TARGET_HANDLE
//
// MessageText:
//
//  The target internal file identifier is incorrect.
//
pub const ERROR_INVALID_TARGET_HANDLE: i32 = 114;

//
// MessageId: ERROR_INVALID_CATEGORY
//
// MessageText:
//
//  The IOCTL call made by the application program is not correct.
//
pub const ERROR_INVALID_CATEGORY: i32 = 117;

//
// MessageId: ERROR_INVALID_VERIFY_SWITCH
//
// MessageText:
//
//  The verify-on-write switch parameter value is not correct.
//
pub const ERROR_INVALID_VERIFY_SWITCH: i32 = 118;

//
// MessageId: ERROR_BAD_DRIVER_LEVEL
//
// MessageText:
//
//  The system does not support the command requested.
//
pub const ERROR_BAD_DRIVER_LEVEL: i32 = 119;

//
// MessageId: ERROR_CALL_NOT_IMPLEMENTED
//
// MessageText:
//
//  This function is not supported on this system.
//
pub const ERROR_CALL_NOT_IMPLEMENTED: i32 = 120;

//
// MessageId: ERROR_SEM_TIMEOUT
//
// MessageText:
//
//  The semaphore timeout period has expired.
//
pub const ERROR_SEM_TIMEOUT: i32 = 121;

//
// MessageId: ERROR_INSUFFICIENT_BUFFER
//
// MessageText:
//
//  The data area passed to a system call is too small.
//
pub const ERROR_INSUFFICIENT_BUFFER: i32 = 122; // dderror

//
// MessageId: ERROR_INVALID_NAME
//
// MessageText:
//
//  The filename, directory name, or volume label syntax is incorrect.
//
pub const ERROR_INVALID_NAME: i32 = 123; // dderror

//
// MessageId: ERROR_INVALID_LEVEL
//
// MessageText:
//
//  The system call level is not correct.
//
pub const ERROR_INVALID_LEVEL: i32 = 124;

//
// MessageId: ERROR_NO_VOLUME_LABEL
//
// MessageText:
//
//  The disk has no volume label.
//
pub const ERROR_NO_VOLUME_LABEL: i32 = 125;

//
// MessageId: ERROR_MOD_NOT_FOUND
//
// MessageText:
//
//  The specified module could not be found.
//
pub const ERROR_MOD_NOT_FOUND: i32 = 126;

//
// MessageId: ERROR_PROC_NOT_FOUND
//
// MessageText:
//
//  The specified procedure could not be found.
//
pub const ERROR_PROC_NOT_FOUND: i32 = 127;

//
// MessageId: ERROR_WAIT_NO_CHILDREN
//
// MessageText:
//
//  There are no child processes to wait for.
//
pub const ERROR_WAIT_NO_CHILDREN: i32 = 128;

//
// MessageId: ERROR_CHILD_NOT_COMPLETE
//
// MessageText:
//
//  The %1 application cannot be run in Win32 mode.
//
pub const ERROR_CHILD_NOT_COMPLETE: i32 = 129;

//
// MessageId: ERROR_DIRECT_ACCESS_HANDLE
//
// MessageText:
//
//  Attempt to use a file handle to an open disk partition for an operation other than raw disk I/O.
//
pub const ERROR_DIRECT_ACCESS_HANDLE: i32 = 130;

//
// MessageId: ERROR_NEGATIVE_SEEK
//
// MessageText:
//
//  An attempt was made to move the file pointer before the beginning of the file.
//
pub const ERROR_NEGATIVE_SEEK: i32 = 131;

//
// MessageId: ERROR_SEEK_ON_DEVICE
//
// MessageText:
//
//  The file pointer cannot be set on the specified device or file.
//
pub const ERROR_SEEK_ON_DEVICE: i32 = 132;

//
// MessageId: ERROR_IS_JOIN_TARGET
//
// MessageText:
//
//  A JOIN or SUBST command cannot be used for a drive that contains previously joined drives.
//
pub const ERROR_IS_JOIN_TARGET: i32 = 133;

//
// MessageId: ERROR_IS_JOINED
//
// MessageText:
//
//  An attempt was made to use a JOIN or SUBST command on a drive that has already been joined.
//
pub const ERROR_IS_JOINED: i32 = 134;

//
// MessageId: ERROR_IS_SUBSTED
//
// MessageText:
//
//  An attempt was made to use a JOIN or SUBST command on a drive that has already been substituted.
//
pub const ERROR_IS_SUBSTED: i32 = 135;

//
// MessageId: ERROR_NOT_JOINED
//
// MessageText:
//
//  The system tried to delete the JOIN of a drive that is not joined.
//
pub const ERROR_NOT_JOINED: i32 = 136;

//
// MessageId: ERROR_NOT_SUBSTED
//
// MessageText:
//
//  The system tried to delete the substitution of a drive that is not substituted.
//
pub const ERROR_NOT_SUBSTED: i32 = 137;

//
// MessageId: ERROR_JOIN_TO_JOIN
//
// MessageText:
//
//  The system tried to join a drive to a directory on a joined drive.
//
pub const ERROR_JOIN_TO_JOIN: i32 = 138;

//
// MessageId: ERROR_SUBST_TO_SUBST
//
// MessageText:
//
//  The system tried to substitute a drive to a directory on a substituted drive.
//
pub const ERROR_SUBST_TO_SUBST: i32 = 139;

//
// MessageId: ERROR_JOIN_TO_SUBST
//
// MessageText:
//
//  The system tried to join a drive to a directory on a substituted drive.
//
pub const ERROR_JOIN_TO_SUBST: i32 = 140;

//
// MessageId: ERROR_SUBST_TO_JOIN
//
// MessageText:
//
//  The system tried to SUBST a drive to a directory on a joined drive.
//
pub const ERROR_SUBST_TO_JOIN: i32 = 141;

//
// MessageId: ERROR_BUSY_DRIVE
//
// MessageText:
//
//  The system cannot perform a JOIN or SUBST at this time.
//
pub const ERROR_BUSY_DRIVE: i32 = 142;

//
// MessageId: ERROR_SAME_DRIVE
//
// MessageText:
//
//  The system cannot join or substitute a drive to or for a directory on the same drive.
//
pub const ERROR_SAME_DRIVE: i32 = 143;

//
// MessageId: ERROR_DIR_NOT_ROOT
//
// MessageText:
//
//  The directory is not a subdirectory of the root directory.
//
pub const ERROR_DIR_NOT_ROOT: i32 = 144;

//
// MessageId: ERROR_DIR_NOT_EMPTY
//
// MessageText:
//
//  The directory is not empty.
//
pub const ERROR_DIR_NOT_EMPTY: i32 = 145;

//
// MessageId: ERROR_IS_SUBST_PATH
//
// MessageText:
//
//  The path specified is being used in a substitute.
//
pub const ERROR_IS_SUBST_PATH: i32 = 146;

//
// MessageId: ERROR_IS_JOIN_PATH
//
// MessageText:
//
//  Not enough resources are available to process this command.
//
pub const ERROR_IS_JOIN_PATH: i32 = 147;

//
// MessageId: ERROR_PATH_BUSY
//
// MessageText:
//
//  The path specified cannot be used at this time.
//
pub const ERROR_PATH_BUSY: i32 = 148;

//
// MessageId: ERROR_IS_SUBST_TARGET
//
// MessageText:
//
//  An attempt was made to join or substitute a drive for which a directory on the drive is the target of a previous substitute.
//
pub const ERROR_IS_SUBST_TARGET: i32 = 149;

//
// MessageId: ERROR_SYSTEM_TRACE
//
// MessageText:
//
//  System trace information was not specified in your CONFIG.SYS file, or tracing is disallowed.
//
pub const ERROR_SYSTEM_TRACE: i32 = 150;

//
// MessageId: ERROR_INVALID_EVENT_COUNT
//
// MessageText:
//
//  The number of specified semaphore events for DosMuxSemWait is not correct.
//
pub const ERROR_INVALID_EVENT_COUNT: i32 = 151;

//
// MessageId: ERROR_TOO_MANY_MUXWAITERS
//
// MessageText:
//
//  DosMuxSemWait did not execute; too many semaphores are already set.
//
pub const ERROR_TOO_MANY_MUXWAITERS: i32 = 152;

//
// MessageId: ERROR_INVALID_LIST_FORMAT
//
// MessageText:
//
//  The DosMuxSemWait list is not correct.
//
pub const ERROR_INVALID_LIST_FORMAT: i32 = 153;

//
// MessageId: ERROR_LABEL_TOO_LONG
//
// MessageText:
//
//  The volume label you entered exceeds the label character limit of the target file system.
//
pub const ERROR_LABEL_TOO_LONG: i32 = 154;

//
// MessageId: ERROR_TOO_MANY_TCBS
//
// MessageText:
//
//  Cannot create another thread.
//
pub const ERROR_TOO_MANY_TCBS: i32 = 155;

//
// MessageId: ERROR_SIGNAL_REFUSED
//
// MessageText:
//
//  The recipient process has refused the signal.
//
pub const ERROR_SIGNAL_REFUSED: i32 = 156;

//
// MessageId: ERROR_DISCARDED
//
// MessageText:
//
//  The segment is already discarded and cannot be locked.
//
pub const ERROR_DISCARDED: i32 = 157;

//
// MessageId: ERROR_NOT_LOCKED
//
// MessageText:
//
//  The segment is already unlocked.
//
pub const ERROR_NOT_LOCKED: i32 = 158;

//
// MessageId: ERROR_BAD_THREADID_ADDR
//
// MessageText:
//
//  The address for the thread ID is not correct.
//
pub const ERROR_BAD_THREADID_ADDR: i32 = 159;

//
// MessageId: ERROR_BAD_ARGUMENTS
//
// MessageText:
//
//  One or more arguments are not correct.
//
pub const ERROR_BAD_ARGUMENTS: i32 = 160;

//
// MessageId: ERROR_BAD_PATHNAME
//
// MessageText:
//
//  The specified path is invalid.
//
pub const ERROR_BAD_PATHNAME: i32 = 161;

//
// MessageId: ERROR_SIGNAL_PENDING
//
// MessageText:
//
//  A signal is already pending.
//
pub const ERROR_SIGNAL_PENDING: i32 = 162;

//
// MessageId: ERROR_MAX_THRDS_REACHED
//
// MessageText:
//
//  No more threads can be created in the system.
//
pub const ERROR_MAX_THRDS_REACHED: i32 = 164;

//
// MessageId: ERROR_LOCK_FAILED
//
// MessageText:
//
//  Unable to lock a region of a file.
//
pub const ERROR_LOCK_FAILED: i32 = 167;

//
// MessageId: ERROR_BUSY
//
// MessageText:
//
//  The requested resource is in use.
//
pub const ERROR_BUSY: i32 = 170; // dderror

//
// MessageId: ERROR_CANCEL_VIOLATION
//
// MessageText:
//
//  A lock request was not outstanding for the supplied cancel region.
//
pub const ERROR_CANCEL_VIOLATION: i32 = 173;

//
// MessageId: ERROR_ATOMIC_LOCKS_NOT_SUPPORTED
//
// MessageText:
//
//  The file system does not support atomic changes to the lock type.
//
pub const ERROR_ATOMIC_LOCKS_NOT_SUPPORTED: i32 = 174;

//
// MessageId: ERROR_INVALID_SEGMENT_NUMBER
//
// MessageText:
//
//  The system detected a segment number that was not correct.
//
pub const ERROR_INVALID_SEGMENT_NUMBER: i32 = 180;

//
// MessageId: ERROR_INVALID_ORDINAL
//
// MessageText:
//
//  The operating system cannot run %1.
//
pub const ERROR_INVALID_ORDINAL: i32 = 182;

//
// MessageId: ERROR_ALREADY_EXISTS
//
// MessageText:
//
//  Cannot create a file when that file already exists.
//
pub const ERROR_ALREADY_EXISTS: i32 = 183;

//
// MessageId: ERROR_INVALID_FLAG_NUMBER
//
// MessageText:
//
//  The flag passed is not correct.
//
pub const ERROR_INVALID_FLAG_NUMBER: i32 = 186;

//
// MessageId: ERROR_SEM_NOT_FOUND
//
// MessageText:
//
//  The specified system semaphore name was not found.
//
pub const ERROR_SEM_NOT_FOUND: i32 = 187;

//
// MessageId: ERROR_INVALID_STARTING_CODESEG
//
// MessageText:
//
//  The operating system cannot run %1.
//
pub const ERROR_INVALID_STARTING_CODESEG: i32 = 188;

//
// MessageId: ERROR_INVALID_STACKSEG
//
// MessageText:
//
//  The operating system cannot run %1.
//
pub const ERROR_INVALID_STACKSEG: i32 = 189;

//
// MessageId: ERROR_INVALID_MODULETYPE
//
// MessageText:
//
//  The operating system cannot run %1.
//
pub const ERROR_INVALID_MODULETYPE: i32 = 190;

//
// MessageId: ERROR_INVALID_EXE_SIGNATURE
//
// MessageText:
//
//  Cannot run %1 in Win32 mode.
//
pub const ERROR_INVALID_EXE_SIGNATURE: i32 = 191;

//
// MessageId: ERROR_EXE_MARKED_INVALID
//
// MessageText:
//
//  The operating system cannot run %1.
//
pub const ERROR_EXE_MARKED_INVALID: i32 = 192;

//
// MessageId: ERROR_BAD_EXE_FORMAT
//
// MessageText:
//
//  %1 is not a valid Win32 application.
//
pub const ERROR_BAD_EXE_FORMAT: i32 = 193;

//
// MessageId: ERROR_ITERATED_DATA_EXCEEDS_64k
//
// MessageText:
//
//  The operating system cannot run %1.
//
// deno-lint-ignore camelcase
pub const ERROR_ITERATED_DATA_EXCEEDS_64K: i32 = 194;

//
// MessageId: ERROR_INVALID_MINALLOCSIZE
//
// MessageText:
//
//  The operating system cannot run %1.
//
pub const ERROR_INVALID_MINALLOCSIZE: i32 = 195;

//
// MessageId: ERROR_DYNLINK_FROM_INVALID_RING
//
// MessageText:
//
//  The operating system cannot run this application program.
//
pub const ERROR_DYNLINK_FROM_INVALID_RING: i32 = 196;

//
// MessageId: ERROR_IOPL_NOT_ENABLED
//
// MessageText:
//
//  The operating system is not presently configured to run this application.
//
pub const ERROR_IOPL_NOT_ENABLED: i32 = 197;

//
// MessageId: ERROR_INVALID_SEGDPL
//
// MessageText:
//
//  The operating system cannot run %1.
//
pub const ERROR_INVALID_SEGDPL: i32 = 198;

//
// MessageId: ERROR_AUTODATASEG_EXCEEDS_64k
//
// MessageText:
//
//  The operating system cannot run this application program.
//
// deno-lint-ignore camelcase
pub const ERROR_AUTODATASEG_EXCEEDS_64K: i32 = 199;

//
// MessageId: ERROR_RING2SEG_MUST_BE_MOVABLE
//
// MessageText:
//
//  The code segment cannot be greater than or equal to 64K.
//
pub const ERROR_RING2SEG_MUST_BE_MOVABLE: i32 = 200;

//
// MessageId: ERROR_RELOC_CHAIN_XEEDS_SEGLIM
//
// MessageText:
//
//  The operating system cannot run %1.
//
pub const ERROR_RELOC_CHAIN_XEEDS_SEGLIM: i32 = 201;

//
// MessageId: ERROR_INFLOOP_IN_RELOC_CHAIN
//
// MessageText:
//
//  The operating system cannot run %1.
//
pub const ERROR_INFLOOP_IN_RELOC_CHAIN: i32 = 202;

//
// MessageId: ERROR_ENVVAR_NOT_FOUND
//
// MessageText:
//
//  The system could not find the environment option that was entered.
//
pub const ERROR_ENVVAR_NOT_FOUND: i32 = 203;

//
// MessageId: ERROR_NO_SIGNAL_SENT
//
// MessageText:
//
//  No process in the command subtree has a signal handler.
//
pub const ERROR_NO_SIGNAL_SENT: i32 = 205;

//
// MessageId: ERROR_FILENAME_EXCED_RANGE
//
// MessageText:
//
//  The filename or extension is too long.
//
pub const ERROR_FILENAME_EXCED_RANGE: i32 = 206;

//
// MessageId: ERROR_RING2_STACK_IN_USE
//
// MessageText:
//
//  The ring 2 stack is in use.
//
pub const ERROR_RING2_STACK_IN_USE: i32 = 207;

//
// MessageId: ERROR_META_EXPANSION_TOO_LONG
//
// MessageText:
//
//  The global filename characters, * or ?, are entered incorrectly or too many global filename characters are specified.
//
pub const ERROR_META_EXPANSION_TOO_LONG: i32 = 208;

//
// MessageId: ERROR_INVALID_SIGNAL_NUMBER
//
// MessageText:
//
//  The signal being posted is not correct.
//
pub const ERROR_INVALID_SIGNAL_NUMBER: i32 = 209;

//
// MessageId: ERROR_THREAD_1_INACTIVE
//
// MessageText:
//
//  The signal handler cannot be set.
//
pub const ERROR_THREAD_1_INACTIVE: i32 = 210;

//
// MessageId: ERROR_LOCKED
//
// MessageText:
//
//  The segment is locked and cannot be reallocated.
//
pub const ERROR_LOCKED: i32 = 212;

//
// MessageId: ERROR_TOO_MANY_MODULES
//
// MessageText:
//
//  Too many dynamic-link modules are attached to this program or dynamic-link module.
//
pub const ERROR_TOO_MANY_MODULES: i32 = 214;

//
// MessageId: ERROR_NESTING_NOT_ALLOWED
//
// MessageText:
//
//  Cannot nest calls to LoadModule.
//
pub const ERROR_NESTING_NOT_ALLOWED: i32 = 215;

//
// MessageId: ERROR_EXE_MACHINE_TYPE_MISMATCH
//
// MessageText:
//
//  The image file %1 is valid, but is for a machine type other than the current machine.
//
pub const ERROR_EXE_MACHINE_TYPE_MISMATCH: i32 = 216;

//
// MessageId: ERROR_EXE_CANNOT_MODIFY_SIGNED_BINARY
//
// MessageText:
//
//  The image file %1 is signed, unable to modify.
//
pub const ERROR_EXE_CANNOT_MODIFY_SIGNED_BINARY: i32 = 217;

//
// MessageId: ERROR_EXE_CANNOT_MODIFY_STRONG_SIGNED_BINARY
//
// MessageText:
//
//  The image file %1 is strong signed, unable to modify.
//
pub const ERROR_EXE_CANNOT_MODIFY_STRONG_SIGNED_BINARY: i32 = 218;

//
// MessageId: ERROR_BAD_PIPE
//
// MessageText:
//
//  The pipe state is invalid.
//
pub const ERROR_BAD_PIPE: i32 = 230;

//
// MessageId: ERROR_PIPE_BUSY
//
// MessageText:
//
//  All pipe instances are busy.
//
pub const ERROR_PIPE_BUSY: i32 = 231;

//
// MessageId: ERROR_NO_DATA
//
// MessageText:
//
//  The pipe is being closed.
//
pub const ERROR_NO_DATA: i32 = 232;

//
// MessageId: ERROR_PIPE_NOT_CONNECTED
//
// MessageText:
//
//  No process is on the other end of the pipe.
//
pub const ERROR_PIPE_NOT_CONNECTED: i32 = 233;

//
// MessageId: ERROR_MORE_DATA
//
// MessageText:
//
//  More data is available.
//
pub const ERROR_MORE_DATA: i32 = 234; // dderror

//
// MessageId: ERROR_VC_DISCONNECTED
//
// MessageText:
//
//  The session was canceled.
//
pub const ERROR_VC_DISCONNECTED: i32 = 240;

//
// MessageId: ERROR_INVALID_EA_NAME
//
// MessageText:
//
//  The specified extended attribute name was invalid.
//
pub const ERROR_INVALID_EA_NAME: i32 = 254;

//
// MessageId: ERROR_EA_LIST_INCONSISTENT
//
// MessageText:
//
//  The extended attributes are inconsistent.
//
pub const ERROR_EA_LIST_INCONSISTENT: i32 = 255;

//
// MessageId: WAIT_TIMEOUT
//
// MessageText:
//
//  The wait operation timed out.
//
pub const WAIT_TIMEOUT: i32 = 258; // dderror

//
// MessageId: ERROR_NO_MORE_ITEMS
//
// MessageText:
//
//  No more data is available.
//
pub const ERROR_NO_MORE_ITEMS: i32 = 259;

//
// MessageId: ERROR_CANNOT_COPY
//
// MessageText:
//
//  The copy functions cannot be used.
//
pub const ERROR_CANNOT_COPY: i32 = 266;

//
// MessageId: ERROR_DIRECTORY
//
// MessageText:
//
//  The directory name is invalid.
//
pub const ERROR_DIRECTORY: i32 = 267;

//
// MessageId: ERROR_EAS_DIDNT_FIT
//
// MessageText:
//
//  The extended attributes did not fit in the buffer.
//
pub const ERROR_EAS_DIDNT_FIT: i32 = 275;

//
// MessageId: ERROR_EA_FILE_CORRUPT
//
// MessageText:
//
//  The extended attribute file on the mounted file system is corrupt.
//
pub const ERROR_EA_FILE_CORRUPT: i32 = 276;

//
// MessageId: ERROR_EA_TABLE_FULL
//
// MessageText:
//
//  The extended attribute table file is full.
//
pub const ERROR_EA_TABLE_FULL: i32 = 277;

//
// MessageId: ERROR_INVALID_EA_HANDLE
//
// MessageText:
//
//  The specified extended attribute handle is invalid.
//
pub const ERROR_INVALID_EA_HANDLE: i32 = 278;

//
// MessageId: ERROR_EAS_NOT_SUPPORTED
//
// MessageText:
//
//  The mounted file system does not support extended attributes.
//
pub const ERROR_EAS_NOT_SUPPORTED: i32 = 282;

//
// MessageId: ERROR_NOT_OWNER
//
// MessageText:
//
//  Attempt to release mutex not owned by caller.
//
pub const ERROR_NOT_OWNER: i32 = 288;

//
// MessageId: ERROR_TOO_MANY_POSTS
//
// MessageText:
//
//  Too many posts were made to a semaphore.
//
pub const ERROR_TOO_MANY_POSTS: i32 = 298;

//
// MessageId: ERROR_PARTIAL_COPY
//
// MessageText:
//
//  Only part of a ReadProcessMemory or WriteProcessMemory request was completed.
//
pub const ERROR_PARTIAL_COPY: i32 = 299;

//
// MessageId: ERROR_OPLOCK_NOT_GRANTED
//
// MessageText:
//
//  The oplock request is denied.
//
pub const ERROR_OPLOCK_NOT_GRANTED: i32 = 300;

//
// MessageId: ERROR_INVALID_OPLOCK_PROTOCOL
//
// MessageText:
//
//  An invalid oplock acknowledgment was received by the system.
//
pub const ERROR_INVALID_OPLOCK_PROTOCOL: i32 = 301;

//
// MessageId: ERROR_DISK_TOO_FRAGMENTED
//
// MessageText:
//
//  The volume is too fragmented to complete this operation.
//
pub const ERROR_DISK_TOO_FRAGMENTED: i32 = 302;

//
// MessageId: ERROR_DELETE_PENDING
//
// MessageText:
//
//  The file cannot be opened because it is in the process of being deleted.
//
pub const ERROR_DELETE_PENDING: i32 = 303;

//
// MessageId: ERROR_MR_MID_NOT_FOUND
//
// MessageText:
//
//  The system cannot find message text for message number 0x%1 in the message file for %2.
//
pub const ERROR_MR_MID_NOT_FOUND: i32 = 317;

//
// MessageId: ERROR_SCOPE_NOT_FOUND
//
// MessageText:
//
//  The scope specified was not found.
//
pub const ERROR_SCOPE_NOT_FOUND: i32 = 318;

//
// MessageId: ERROR_INVALID_ADDRESS
//
// MessageText:
//
//  Attempt to access invalid address.
//
pub const ERROR_INVALID_ADDRESS: i32 = 487;

//
// MessageId: ERROR_ARITHMETIC_OVERFLOW
//
// MessageText:
//
//  Arithmetic result exceeded 32 bits.
//
pub const ERROR_ARITHMETIC_OVERFLOW: i32 = 534;

//
// MessageId: ERROR_PIPE_CONNECTED
//
// MessageText:
//
//  There is a process on other end of the pipe.
//
pub const ERROR_PIPE_CONNECTED: i32 = 535;

//
// MessageId: ERROR_PIPE_LISTENING
//
// MessageText:
//
//  Waiting for a process to open the other end of the pipe.
//
pub const ERROR_PIPE_LISTENING: i32 = 536;

//
// MessageId: ERROR_EA_ACCESS_DENIED
//
// MessageText:
//
//  Access to the extended attribute was denied.
//
pub const ERROR_EA_ACCESS_DENIED: i32 = 994;

//
// MessageId: ERROR_OPERATION_ABORTED
//
// MessageText:
//
//  The I/O operation has been aborted because of either a thread exit or an application request.
//
pub const ERROR_OPERATION_ABORTED: i32 = 995;

//
// MessageId: ERROR_IO_INCOMPLETE
//
// MessageText:
//
//  Overlapped I/O event is not in a signaled state.
//
pub const ERROR_IO_INCOMPLETE: i32 = 996;

//
// MessageId: ERROR_IO_PENDING
//
// MessageText:
//
//  Overlapped I/O operation is in progress.
//
pub const ERROR_IO_PENDING: i32 = 997; // dderror

//
// MessageId: ERROR_NOACCESS
//
// MessageText:
//
//  Invalid access to memory location.
//
pub const ERROR_NOACCESS: i32 = 998;

//
// MessageId: ERROR_SWAPERROR
//
// MessageText:
//
//  Error performing inpage operation.
//
pub const ERROR_SWAPERROR: i32 = 999;

//
// MessageId: ERROR_STACK_OVERFLOW
//
// MessageText:
//
//  Recursion too deep; the stack overflowed.
//
pub const ERROR_STACK_OVERFLOW: i32 = 1001;

//
// MessageId: ERROR_INVALID_MESSAGE
//
// MessageText:
//
//  The window cannot act on the sent message.
//
pub const ERROR_INVALID_MESSAGE: i32 = 1002;

//
// MessageId: ERROR_CAN_NOT_COMPLETE
//
// MessageText:
//
//  Cannot complete this function.
//
pub const ERROR_CAN_NOT_COMPLETE: i32 = 1003;

//
// MessageId: ERROR_INVALID_FLAGS
//
// MessageText:
//
//  Invalid flags.
//
pub const ERROR_INVALID_FLAGS: i32 = 1004;

//
// MessageId: ERROR_UNRECOGNIZED_VOLUME
//
// MessageText:
//
//  The volume does not contain a recognized file system.
//  Please make sure that all required file system drivers are loaded and that the volume is not corrupted.
//
pub const ERROR_UNRECOGNIZED_VOLUME: i32 = 1005;

//
// MessageId: ERROR_FILE_INVALID
//
// MessageText:
//
//  The volume for a file has been externally altered so that the opened file is no longer valid.
//
pub const ERROR_FILE_INVALID: i32 = 1006;

//
// MessageId: ERROR_FULLSCREEN_MODE
//
// MessageText:
//
//  The requested operation cannot be performed in full-screen mode.
//
pub const ERROR_FULLSCREEN_MODE: i32 = 1007;

//
// MessageId: ERROR_NO_TOKEN
//
// MessageText:
//
//  An attempt was made to reference a token that does not exist.
//
pub const ERROR_NO_TOKEN: i32 = 1008;

//
// MessageId: ERROR_BADDB
//
// MessageText:
//
//  The configuration registry database is corrupt.
//
pub const ERROR_BADDB: i32 = 1009;

//
// MessageId: ERROR_BADKEY
//
// MessageText:
//
//  The configuration registry key is invalid.
//
pub const ERROR_BADKEY: i32 = 1010;

//
// MessageId: ERROR_CANTOPEN
//
// MessageText:
//
//  The configuration registry key could not be opened.
//
pub const ERROR_CANTOPEN: i32 = 1011;

//
// MessageId: ERROR_CANTREAD
//
// MessageText:
//
//  The configuration registry key could not be read.
//
pub const ERROR_CANTREAD: i32 = 1012;

//
// MessageId: ERROR_CANTWRITE
//
// MessageText:
//
//  The configuration registry key could not be written.
//
pub const ERROR_CANTWRITE: i32 = 1013;

//
// MessageId: ERROR_REGISTRY_RECOVERED
//
// MessageText:
//
//  One of the files in the registry database had to be recovered by use of a log or alternate copy. The recovery was successful.
//
pub const ERROR_REGISTRY_RECOVERED: i32 = 1014;

//
// MessageId: ERROR_REGISTRY_CORRUPT
//
// MessageText:
//
//  The registry is corrupted. The structure of one of the files containing registry data is corrupted, or the system's memory image of the file is corrupted, or the file could not be recovered because the alternate copy or log was absent or corrupted.
//
pub const ERROR_REGISTRY_CORRUPT: i32 = 1015;

//
// MessageId: ERROR_REGISTRY_IO_FAILED
//
// MessageText:
//
//  An I/O operation initiated by the registry failed unrecoverably. The registry could not read in, or write out, or flush, one of the files that contain the system's image of the registry.
//
pub const ERROR_REGISTRY_IO_FAILED: i32 = 1016;

//
// MessageId: ERROR_NOT_REGISTRY_FILE
//
// MessageText:
//
//  The system has attempted to load or restore a file into the registry, but the specified file is not in a registry file format.
//
pub const ERROR_NOT_REGISTRY_FILE: i32 = 1017;

//
// MessageId: ERROR_KEY_DELETED
//
// MessageText:
//
//  Illegal operation attempted on a registry key that has been marked for deletion.
//
pub const ERROR_KEY_DELETED: i32 = 1018;

//
// MessageId: ERROR_NO_LOG_SPACE
//
// MessageText:
//
//  System could not allocate the required space in a registry log.
//
pub const ERROR_NO_LOG_SPACE: i32 = 1019;

//
// MessageId: ERROR_KEY_HAS_CHILDREN
//
// MessageText:
//
//  Cannot create a symbolic link in a registry key that already has subkeys or values.
//
pub const ERROR_KEY_HAS_CHILDREN: i32 = 1020;

//
// MessageId: ERROR_CHILD_MUST_BE_VOLATILE
//
// MessageText:
//
//  Cannot create a stable subkey under a volatile parent key.
//
pub const ERROR_CHILD_MUST_BE_VOLATILE: i32 = 1021;

//
// MessageId: ERROR_NOTIFY_ENUM_DIR
//
// MessageText:
//
//  A notify change request is being completed and the information is not being returned in the caller's buffer. The caller now needs to enumerate the files to find the changes.
//
pub const ERROR_NOTIFY_ENUM_DIR: i32 = 1022;

//
// MessageId: ERROR_DEPENDENT_SERVICES_RUNNING
//
// MessageText:
//
//  A stop control has been sent to a service that other running services are dependent on.
//
pub const ERROR_DEPENDENT_SERVICES_RUNNING: i32 = 1051;

//
// MessageId: ERROR_INVALID_SERVICE_CONTROL
//
// MessageText:
//
//  The requested control is not valid for this service.
//
pub const ERROR_INVALID_SERVICE_CONTROL: i32 = 1052;

//
// MessageId: ERROR_SERVICE_REQUEST_TIMEOUT
//
// MessageText:
//
//  The service did not respond to the start or control request in a timely fashion.
//
pub const ERROR_SERVICE_REQUEST_TIMEOUT: i32 = 1053;

//
// MessageId: ERROR_SERVICE_NO_THREAD
//
// MessageText:
//
//  A thread could not be created for the service.
//
pub const ERROR_SERVICE_NO_THREAD: i32 = 1054;

//
// MessageId: ERROR_SERVICE_DATABASE_LOCKED
//
// MessageText:
//
//  The service database is locked.
//
pub const ERROR_SERVICE_DATABASE_LOCKED: i32 = 1055;

//
// MessageId: ERROR_SERVICE_ALREADY_RUNNING
//
// MessageText:
//
//  An instance of the service is already running.
//
pub const ERROR_SERVICE_ALREADY_RUNNING: i32 = 1056;

//
// MessageId: ERROR_INVALID_SERVICE_ACCOUNT
//
// MessageText:
//
//  The account name is invalid or does not exist, or the password is invalid for the account name specified.
//
pub const ERROR_INVALID_SERVICE_ACCOUNT: i32 = 1057;

//
// MessageId: ERROR_SERVICE_DISABLED
//
// MessageText:
//
//  The service cannot be started, either because it is disabled or because it has no enabled devices associated with it.
//
pub const ERROR_SERVICE_DISABLED: i32 = 1058;

//
// MessageId: ERROR_CIRCULAR_DEPENDENCY
//
// MessageText:
//
//  Circular service dependency was specified.
//
pub const ERROR_CIRCULAR_DEPENDENCY: i32 = 1059;

//
// MessageId: ERROR_SERVICE_DOES_NOT_EXIST
//
// MessageText:
//
//  The specified service does not exist as an installed service.
//
pub const ERROR_SERVICE_DOES_NOT_EXIST: i32 = 1060;

//
// MessageId: ERROR_SERVICE_CANNOT_ACCEPT_CTRL
//
// MessageText:
//
//  The service cannot accept control messages at this time.
//
pub const ERROR_SERVICE_CANNOT_ACCEPT_CTRL: i32 = 1061;

//
// MessageId: ERROR_SERVICE_NOT_ACTIVE
//
// MessageText:
//
//  The service has not been started.
//
pub const ERROR_SERVICE_NOT_ACTIVE: i32 = 1062;

//
// MessageId: ERROR_FAILED_SERVICE_CONTROLLER_CONNECT
//
// MessageText:
//
//  The service process could not connect to the service controller.
//
pub const ERROR_FAILED_SERVICE_CONTROLLER_CONNECT: i32 = 1063;

//
// MessageId: ERROR_EXCEPTION_IN_SERVICE
//
// MessageText:
//
//  An exception occurred in the service when handling the control request.
//
pub const ERROR_EXCEPTION_IN_SERVICE: i32 = 1064;

//
// MessageId: ERROR_DATABASE_DOES_NOT_EXIST
//
// MessageText:
//
//  The database specified does not exist.
//
pub const ERROR_DATABASE_DOES_NOT_EXIST: i32 = 1065;

//
// MessageId: ERROR_SERVICE_SPECIFIC_ERROR
//
// MessageText:
//
//  The service has returned a service-specific error code.
//
pub const ERROR_SERVICE_SPECIFIC_ERROR: i32 = 1066;

//
// MessageId: ERROR_PROCESS_ABORTED
//
// MessageText:
//
//  The process terminated unexpectedly.
//
pub const ERROR_PROCESS_ABORTED: i32 = 1067;

//
// MessageId: ERROR_SERVICE_DEPENDENCY_FAIL
//
// MessageText:
//
//  The dependency service or group failed to start.
//
pub const ERROR_SERVICE_DEPENDENCY_FAIL: i32 = 1068;

//
// MessageId: ERROR_SERVICE_LOGON_FAILED
//
// MessageText:
//
//  The service did not start due to a logon failure.
//
pub const ERROR_SERVICE_LOGON_FAILED: i32 = 1069;

//
// MessageId: ERROR_SERVICE_START_HANG
//
// MessageText:
//
//  After starting, the service hung in a start-pending state.
//
pub const ERROR_SERVICE_START_HANG: i32 = 1070;

//
// MessageId: ERROR_INVALID_SERVICE_LOCK
//
// MessageText:
//
//  The specified service database lock is invalid.
//
pub const ERROR_INVALID_SERVICE_LOCK: i32 = 1071;

//
// MessageId: ERROR_SERVICE_MARKED_FOR_DELETE
//
// MessageText:
//
//  The specified service has been marked for deletion.
//
pub const ERROR_SERVICE_MARKED_FOR_DELETE: i32 = 1072;

//
// MessageId: ERROR_SERVICE_EXISTS
//
// MessageText:
//
//  The specified service already exists.
//
pub const ERROR_SERVICE_EXISTS: i32 = 1073;

//
// MessageId: ERROR_ALREADY_RUNNING_LKG
//
// MessageText:
//
//  The system is currently running with the last-known-good configuration.
//
pub const ERROR_ALREADY_RUNNING_LKG: i32 = 1074;

//
// MessageId: ERROR_SERVICE_DEPENDENCY_DELETED
//
// MessageText:
//
//  The dependency service does not exist or has been marked for deletion.
//
pub const ERROR_SERVICE_DEPENDENCY_DELETED: i32 = 1075;

//
// MessageId: ERROR_BOOT_ALREADY_ACCEPTED
//
// MessageText:
//
//  The current boot has already been accepted for use as the last-known-good control set.
//
pub const ERROR_BOOT_ALREADY_ACCEPTED: i32 = 1076;

//
// MessageId: ERROR_SERVICE_NEVER_STARTED
//
// MessageText:
//
//  No attempts to start the service have been made since the last boot.
//
pub const ERROR_SERVICE_NEVER_STARTED: i32 = 1077;

//
// MessageId: ERROR_DUPLICATE_SERVICE_NAME
//
// MessageText:
//
//  The name is already in use as either a service name or a service display name.
//
pub const ERROR_DUPLICATE_SERVICE_NAME: i32 = 1078;

//
// MessageId: ERROR_DIFFERENT_SERVICE_ACCOUNT
//
// MessageText:
//
//  The account specified for this service is different from the account specified for other services running in the same process.
//
pub const ERROR_DIFFERENT_SERVICE_ACCOUNT: i32 = 1079;

//
// MessageId: ERROR_CANNOT_DETECT_DRIVER_FAILURE
//
// MessageText:
//
//  Failure actions can only be set for Win32 services, not for drivers.
//
pub const ERROR_CANNOT_DETECT_DRIVER_FAILURE: i32 = 1080;

//
// MessageId: ERROR_CANNOT_DETECT_PROCESS_ABORT
//
// MessageText:
//
//  This service runs in the same process as the service control manager.
//  Therefore, the service control manager cannot take action if this service's process terminates unexpectedly.
//
pub const ERROR_CANNOT_DETECT_PROCESS_ABORT: i32 = 1081;

//
// MessageId: ERROR_NO_RECOVERY_PROGRAM
//
// MessageText:
//
//  No recovery program has been configured for this service.
//
pub const ERROR_NO_RECOVERY_PROGRAM: i32 = 1082;

//
// MessageId: ERROR_SERVICE_NOT_IN_EXE
//
// MessageText:
//
//  The executable program that this service is configured to run in does not implement the service.
//
pub const ERROR_SERVICE_NOT_IN_EXE: i32 = 1083;

//
// MessageId: ERROR_NOT_SAFEBOOT_SERVICE
//
// MessageText:
//
//  This service cannot be started in Safe Mode
//
pub const ERROR_NOT_SAFEBOOT_SERVICE: i32 = 1084;

//
// MessageId: ERROR_END_OF_MEDIA
//
// MessageText:
//
//  The physical end of the tape has been reached.
//
pub const ERROR_END_OF_MEDIA: i32 = 1100;

//
// MessageId: ERROR_FILEMARK_DETECTED
//
// MessageText:
//
//  A tape access reached a filemark.
//
pub const ERROR_FILEMARK_DETECTED: i32 = 1101;

//
// MessageId: ERROR_BEGINNING_OF_MEDIA
//
// MessageText:
//
//  The beginning of the tape or a partition was encountered.
//
pub const ERROR_BEGINNING_OF_MEDIA: i32 = 1102;

//
// MessageId: ERROR_SETMARK_DETECTED
//
// MessageText:
//
//  A tape access reached the end of a set of files.
//
pub const ERROR_SETMARK_DETECTED: i32 = 1103;

//
// MessageId: ERROR_NO_DATA_DETECTED
//
// MessageText:
//
//  No more data is on the tape.
//
pub const ERROR_NO_DATA_DETECTED: i32 = 1104;

//
// MessageId: ERROR_PARTITION_FAILURE
//
// MessageText:
//
//  Tape could not be partitioned.
//
pub const ERROR_PARTITION_FAILURE: i32 = 1105;

//
// MessageId: ERROR_INVALID_BLOCK_LENGTH
//
// MessageText:
//
//  When accessing a new tape of a multivolume partition, the current block size is incorrect.
//
pub const ERROR_INVALID_BLOCK_LENGTH: i32 = 1106;

//
// MessageId: ERROR_DEVICE_NOT_PARTITIONED
//
// MessageText:
//
//  Tape partition information could not be found when loading a tape.
//
pub const ERROR_DEVICE_NOT_PARTITIONED: i32 = 1107;

//
// MessageId: ERROR_UNABLE_TO_LOCK_MEDIA
//
// MessageText:
//
//  Unable to lock the media eject mechanism.
//
pub const ERROR_UNABLE_TO_LOCK_MEDIA: i32 = 1108;

//
// MessageId: ERROR_UNABLE_TO_UNLOAD_MEDIA
//
// MessageText:
//
//  Unable to unload the media.
//
pub const ERROR_UNABLE_TO_UNLOAD_MEDIA: i32 = 1109;

//
// MessageId: ERROR_MEDIA_CHANGED
//
// MessageText:
//
//  The media in the drive may have changed.
//
pub const ERROR_MEDIA_CHANGED: i32 = 1110;

//
// MessageId: ERROR_BUS_RESET
//
// MessageText:
//
//  The I/O bus was reset.
//
pub const ERROR_BUS_RESET: i32 = 1111;

//
// MessageId: ERROR_NO_MEDIA_IN_DRIVE
//
// MessageText:
//
//  No media in drive.
//
pub const ERROR_NO_MEDIA_IN_DRIVE: i32 = 1112;

//
// MessageId: ERROR_NO_UNICODE_TRANSLATION
//
// MessageText:
//
//  No mapping for the Unicode character exists in the target multi-byte code page.
//
pub const ERROR_NO_UNICODE_TRANSLATION: i32 = 1113;

//
// MessageId: ERROR_DLL_INIT_FAILED
//
// MessageText:
//
//  A dynamic link library (DLL) initialization routine failed.
//
pub const ERROR_DLL_INIT_FAILED: i32 = 1114;

//
// MessageId: ERROR_SHUTDOWN_IN_PROGRESS
//
// MessageText:
//
//  A system shutdown is in progress.
//
pub const ERROR_SHUTDOWN_IN_PROGRESS: i32 = 1115;

//
// MessageId: ERROR_NO_SHUTDOWN_IN_PROGRESS
//
// MessageText:
//
//  Unable to abort the system shutdown because no shutdown was in progress.
//
pub const ERROR_NO_SHUTDOWN_IN_PROGRESS: i32 = 1116;

//
// MessageId: ERROR_IO_DEVICE
//
// MessageText:
//
//  The request could not be performed because of an I/O device error.
//
pub const ERROR_IO_DEVICE: i32 = 1117;

//
// MessageId: ERROR_SERIAL_NO_DEVICE
//
// MessageText:
//
//  No serial device was successfully initialized. The serial driver will unload.
//
pub const ERROR_SERIAL_NO_DEVICE: i32 = 1118;

//
// MessageId: ERROR_IRQ_BUSY
//
// MessageText:
//
//  Unable to open a device that was sharing an interrupt request (IRQ) with other devices. At least one other device that uses that IRQ was already opened.
//
pub const ERROR_IRQ_BUSY: i32 = 1119;

//
// MessageId: ERROR_MORE_WRITES
//
// MessageText:
//
//  A serial I/O operation was completed by another write to the serial port.
//  (The IOCTL_SERIAL_XOFF_COUNTER reached zero.)
//
pub const ERROR_MORE_WRITES: i32 = 1120;

//
// MessageId: ERROR_COUNTER_TIMEOUT
//
// MessageText:
//
//  A serial I/O operation completed because the timeout period expired.
//  (The IOCTL_SERIAL_XOFF_COUNTER did not reach zero.)
//
pub const ERROR_COUNTER_TIMEOUT: i32 = 1121;

//
// MessageId: ERROR_FLOPPY_ID_MARK_NOT_FOUND
//
// MessageText:
//
//  No ID address mark was found on the floppy disk.
//
pub const ERROR_FLOPPY_ID_MARK_NOT_FOUND: i32 = 1122;

//
// MessageId: ERROR_FLOPPY_WRONG_CYLINDER
//
// MessageText:
//
//  Mismatch between the floppy disk sector ID field and the floppy disk controller track address.
//
pub const ERROR_FLOPPY_WRONG_CYLINDER: i32 = 1123;

//
// MessageId: ERROR_FLOPPY_UNKNOWN_ERROR
//
// MessageText:
//
//  The floppy disk controller reported an error that is not recognized by the floppy disk driver.
//
pub const ERROR_FLOPPY_UNKNOWN_ERROR: i32 = 1124;

//
// MessageId: ERROR_FLOPPY_BAD_REGISTERS
//
// MessageText:
//
//  The floppy disk controller returned inconsistent results in its registers.
//
pub const ERROR_FLOPPY_BAD_REGISTERS: i32 = 1125;

//
// MessageId: ERROR_DISK_RECALIBRATE_FAILED
//
// MessageText:
//
//  While accessing the hard disk, a recalibrate operation failed, even after retries.
//
pub const ERROR_DISK_RECALIBRATE_FAILED: i32 = 1126;

//
// MessageId: ERROR_DISK_OPERATION_FAILED
//
// MessageText:
//
//  While accessing the hard disk, a disk operation failed even after retries.
//
pub const ERROR_DISK_OPERATION_FAILED: i32 = 1127;

//
// MessageId: ERROR_DISK_RESET_FAILED
//
// MessageText:
//
//  While accessing the hard disk, a disk controller reset was needed, but even that failed.
//
pub const ERROR_DISK_RESET_FAILED: i32 = 1128;

//
// MessageId: ERROR_EOM_OVERFLOW
//
// MessageText:
//
//  Physical end of tape encountered.
//
pub const ERROR_EOM_OVERFLOW: i32 = 1129;

//
// MessageId: ERROR_NOT_ENOUGH_SERVER_MEMORY
//
// MessageText:
//
//  Not enough server storage is available to process this command.
//
pub const ERROR_NOT_ENOUGH_SERVER_MEMORY: i32 = 1130;

//
// MessageId: ERROR_POSSIBLE_DEADLOCK
//
// MessageText:
//
//  A potential deadlock condition has been detected.
//
pub const ERROR_POSSIBLE_DEADLOCK: i32 = 1131;

//
// MessageId: ERROR_MAPPED_ALIGNMENT
//
// MessageText:
//
//  The base address or the file offset specified does not have the proper alignment.
//
pub const ERROR_MAPPED_ALIGNMENT: i32 = 1132;

//
// MessageId: ERROR_SET_POWER_STATE_VETOED
//
// MessageText:
//
//  An attempt to change the system power state was vetoed by another application or driver.
//
pub const ERROR_SET_POWER_STATE_VETOED: i32 = 1140;

//
// MessageId: ERROR_SET_POWER_STATE_FAILED
//
// MessageText:
//
//  The system BIOS failed an attempt to change the system power state.
//
pub const ERROR_SET_POWER_STATE_FAILED: i32 = 1141;

//
// MessageId: ERROR_TOO_MANY_LINKS
//
// MessageText:
//
//  An attempt was made to create more links on a file than the file system supports.
//
pub const ERROR_TOO_MANY_LINKS: i32 = 1142;

//
// MessageId: ERROR_OLD_WIN_VERSION
//
// MessageText:
//
//  The specified program requires a newer version of Windows.
//
pub const ERROR_OLD_WIN_VERSION: i32 = 1150;

//
// MessageId: ERROR_APP_WRONG_OS
//
// MessageText:
//
//  The specified program is not a Windows or MS-DOS program.
//
pub const ERROR_APP_WRONG_OS: i32 = 1151;

//
// MessageId: ERROR_SINGLE_INSTANCE_APP
//
// MessageText:
//
//  Cannot start more than one instance of the specified program.
//
pub const ERROR_SINGLE_INSTANCE_APP: i32 = 1152;

//
// MessageId: ERROR_RMODE_APP
//
// MessageText:
//
//  The specified program was written for an earlier version of Windows.
//
pub const ERROR_RMODE_APP: i32 = 1153;

//
// MessageId: ERROR_INVALID_DLL
//
// MessageText:
//
//  One of the library files needed to run this application is damaged.
//
pub const ERROR_INVALID_DLL: i32 = 1154;

//
// MessageId: ERROR_NO_ASSOCIATION
//
// MessageText:
//
//  No application is associated with the specified file for this operation.
//
pub const ERROR_NO_ASSOCIATION: i32 = 1155;

//
// MessageId: ERROR_DDE_FAIL
//
// MessageText:
//
//  An error occurred in sending the command to the application.
//
pub const ERROR_DDE_FAIL: i32 = 1156;

//
// MessageId: ERROR_DLL_NOT_FOUND
//
// MessageText:
//
//  One of the library files needed to run this application cannot be found.
//
pub const ERROR_DLL_NOT_FOUND: i32 = 1157;

//
// MessageId: ERROR_NO_MORE_USER_HANDLES
//
// MessageText:
//
//  The current process has used all of its system allowance of handles for Window Manager objects.
//
pub const ERROR_NO_MORE_USER_HANDLES: i32 = 1158;

//
// MessageId: ERROR_MESSAGE_SYNC_ONLY
//
// MessageText:
//
//  The message can be used only with synchronous operations.
//
pub const ERROR_MESSAGE_SYNC_ONLY: i32 = 1159;

//
// MessageId: ERROR_SOURCE_ELEMENT_EMPTY
//
// MessageText:
//
//  The indicated source element has no media.
//
pub const ERROR_SOURCE_ELEMENT_EMPTY: i32 = 1160;

//
// MessageId: ERROR_DESTINATION_ELEMENT_FULL
//
// MessageText:
//
//  The indicated destination element already contains media.
//
pub const ERROR_DESTINATION_ELEMENT_FULL: i32 = 1161;

//
// MessageId: ERROR_ILLEGAL_ELEMENT_ADDRESS
//
// MessageText:
//
//  The indicated element does not exist.
//
pub const ERROR_ILLEGAL_ELEMENT_ADDRESS: i32 = 1162;

//
// MessageId: ERROR_MAGAZINE_NOT_PRESENT
//
// MessageText:
//
//  The indicated element is part of a magazine that is not present.
//
pub const ERROR_MAGAZINE_NOT_PRESENT: i32 = 1163;

//
// MessageId: ERROR_DEVICE_REINITIALIZATION_NEEDED
//
// MessageText:
//
//  The indicated device requires reinitialization due to hardware errors.
//
pub const ERROR_DEVICE_REINITIALIZATION_NEEDED: i32 = 1164; // dderror

//
// MessageId: ERROR_DEVICE_REQUIRES_CLEANING
//
// MessageText:
//
//  The device has indicated that cleaning is required before further operations are attempted.
//
pub const ERROR_DEVICE_REQUIRES_CLEANING: i32 = 1165;

//
// MessageId: ERROR_DEVICE_DOOR_OPEN
//
// MessageText:
//
//  The device has indicated that its door is open.
//
pub const ERROR_DEVICE_DOOR_OPEN: i32 = 1166;

//
// MessageId: ERROR_DEVICE_NOT_CONNECTED
//
// MessageText:
//
//  The device is not connected.
//
pub const ERROR_DEVICE_NOT_CONNECTED: i32 = 1167;

//
// MessageId: ERROR_NOT_FOUND
//
// MessageText:
//
//  Element not found.
//
pub const ERROR_NOT_FOUND: i32 = 1168;

//
// MessageId: ERROR_NO_MATCH
//
// MessageText:
//
//  There was no match for the specified key in the index.
//
pub const ERROR_NO_MATCH: i32 = 1169;

//
// MessageId: ERROR_SET_NOT_FOUND
//
// MessageText:
//
//  The property set specified does not exist on the object.
//
pub const ERROR_SET_NOT_FOUND: i32 = 1170;

//
// MessageId: ERROR_POINT_NOT_FOUND
//
// MessageText:
//
//  The point passed to GetMouseMovePoints is not in the buffer.
//
pub const ERROR_POINT_NOT_FOUND: i32 = 1171;

//
// MessageId: ERROR_NO_TRACKING_SERVICE
//
// MessageText:
//
//  The tracking (workstation) service is not running.
//
pub const ERROR_NO_TRACKING_SERVICE: i32 = 1172;

//
// MessageId: ERROR_NO_VOLUME_ID
//
// MessageText:
//
//  The Volume ID could not be found.
//
pub const ERROR_NO_VOLUME_ID: i32 = 1173;

//
// MessageId: ERROR_UNABLE_TO_REMOVE_REPLACED
//
// MessageText:
//
//  Unable to remove the file to be replaced.
//
pub const ERROR_UNABLE_TO_REMOVE_REPLACED: i32 = 1175;

//
// MessageId: ERROR_UNABLE_TO_MOVE_REPLACEMENT
//
// MessageText:
//
//  Unable to move the replacement file to the file to be replaced. The file to be replaced has retained its original name.
//
pub const ERROR_UNABLE_TO_MOVE_REPLACEMENT: i32 = 1176;

//
// MessageId: ERROR_UNABLE_TO_MOVE_REPLACEMENT_2
//
// MessageText:
//
//  Unable to move the replacement file to the file to be replaced. The file to be replaced has been renamed using the backup name.
//
pub const ERROR_UNABLE_TO_MOVE_REPLACEMENT_2: i32 = 1177;

//
// MessageId: ERROR_JOURNAL_DELETE_IN_PROGRESS
//
// MessageText:
//
//  The volume change journal is being deleted.
//
pub const ERROR_JOURNAL_DELETE_IN_PROGRESS: i32 = 1178;

//
// MessageId: ERROR_JOURNAL_NOT_ACTIVE
//
// MessageText:
//
//  The volume change journal is not active.
//
pub const ERROR_JOURNAL_NOT_ACTIVE: i32 = 1179;

//
// MessageId: ERROR_POTENTIAL_FILE_FOUND
//
// MessageText:
//
//  A file was found, but it may not be the correct file.
//
pub const ERROR_POTENTIAL_FILE_FOUND: i32 = 1180;

//
// MessageId: ERROR_JOURNAL_ENTRY_DELETED
//
// MessageText:
//
//  The journal entry has been deleted from the journal.
//
pub const ERROR_JOURNAL_ENTRY_DELETED: i32 = 1181;

//
// MessageId: ERROR_BAD_DEVICE
//
// MessageText:
//
//  The specified device name is invalid.
//
pub const ERROR_BAD_DEVICE: i32 = 1200;

//
// MessageId: ERROR_CONNECTION_UNAVAIL
//
// MessageText:
//
//  The device is not currently connected but it is a remembered connection.
//
pub const ERROR_CONNECTION_UNAVAIL: i32 = 1201;

//
// MessageId: ERROR_DEVICE_ALREADY_REMEMBERED
//
// MessageText:
//
//  The local device name has a remembered connection to another network resource.
//
pub const ERROR_DEVICE_ALREADY_REMEMBERED: i32 = 1202;

//
// MessageId: ERROR_NO_NET_OR_BAD_PATH
//
// MessageText:
//
//  No network provider accepted the given network path.
//
pub const ERROR_NO_NET_OR_BAD_PATH: i32 = 1203;

//
// MessageId: ERROR_BAD_PROVIDER
//
// MessageText:
//
//  The specified network provider name is invalid.
//
pub const ERROR_BAD_PROVIDER: i32 = 1204;

//
// MessageId: ERROR_CANNOT_OPEN_PROFILE
//
// MessageText:
//
//  Unable to open the network connection profile.
//
pub const ERROR_CANNOT_OPEN_PROFILE: i32 = 1205;

//
// MessageId: ERROR_BAD_PROFILE
//
// MessageText:
//
//  The network connection profile is corrupted.
//
pub const ERROR_BAD_PROFILE: i32 = 1206;

//
// MessageId: ERROR_NOT_CONTAINER
//
// MessageText:
//
//  Cannot enumerate a noncontainer.
//
pub const ERROR_NOT_CONTAINER: i32 = 1207;

//
// MessageId: ERROR_EXTENDED_ERROR
//
// MessageText:
//
//  An extended error has occurred.
//
pub const ERROR_EXTENDED_ERROR: i32 = 1208;

//
// MessageId: ERROR_INVALID_GROUPNAME
//
// MessageText:
//
//  The format of the specified group name is invalid.
//
pub const ERROR_INVALID_GROUPNAME: i32 = 1209;

//
// MessageId: ERROR_INVALID_COMPUTERNAME
//
// MessageText:
//
//  The format of the specified computer name is invalid.
//
pub const ERROR_INVALID_COMPUTERNAME: i32 = 1210;

//
// MessageId: ERROR_INVALID_EVENTNAME
//
// MessageText:
//
//  The format of the specified event name is invalid.
//
pub const ERROR_INVALID_EVENTNAME: i32 = 1211;

//
// MessageId: ERROR_INVALID_DOMAINNAME
//
// MessageText:
//
//  The format of the specified domain name is invalid.
//
pub const ERROR_INVALID_DOMAINNAME: i32 = 1212;

//
// MessageId: ERROR_INVALID_SERVICENAME
//
// MessageText:
//
//  The format of the specified service name is invalid.
//
pub const ERROR_INVALID_SERVICENAME: i32 = 1213;

//
// MessageId: ERROR_INVALID_NETNAME
//
// MessageText:
//
//  The format of the specified network name is invalid.
//
pub const ERROR_INVALID_NETNAME: i32 = 1214;

//
// MessageId: ERROR_INVALID_SHARENAME
//
// MessageText:
//
//  The format of the specified share name is invalid.
//
pub const ERROR_INVALID_SHARENAME: i32 = 1215;

//
// MessageId: ERROR_INVALID_PASSWORDNAME
//
// MessageText:
//
//  The format of the specified password is invalid.
//
pub const ERROR_INVALID_PASSWORDNAME: i32 = 1216;

//
// MessageId: ERROR_INVALID_MESSAGENAME
//
// MessageText:
//
//  The format of the specified message name is invalid.
//
pub const ERROR_INVALID_MESSAGENAME: i32 = 1217;

//
// MessageId: ERROR_INVALID_MESSAGEDEST
//
// MessageText:
//
//  The format of the specified message destination is invalid.
//
pub const ERROR_INVALID_MESSAGEDEST: i32 = 1218;

//
// MessageId: ERROR_SESSION_CREDENTIAL_CONFLICT
//
// MessageText:
//
//  Multiple connections to a server or shared resource by the same user, using more than one user name, are not allowed. Disconnect all previous connections to the server or shared resource and try again.
//
pub const ERROR_SESSION_CREDENTIAL_CONFLICT: i32 = 1219;

//
// MessageId: ERROR_REMOTE_SESSION_LIMIT_EXCEEDED
//
// MessageText:
//
//  An attempt was made to establish a session to a network server, but there are already too many sessions established to that server.
//
pub const ERROR_REMOTE_SESSION_LIMIT_EXCEEDED: i32 = 1220;

//
// MessageId: ERROR_DUP_DOMAINNAME
//
// MessageText:
//
//  The workgroup or domain name is already in use by another computer on the network.
//
pub const ERROR_DUP_DOMAINNAME: i32 = 1221;

//
// MessageId: ERROR_NO_NETWORK
//
// MessageText:
//
//  The network is not present or not started.
//
pub const ERROR_NO_NETWORK: i32 = 1222;

//
// MessageId: ERROR_CANCELLED
//
// MessageText:
//
//  The operation was canceled by the user.
//
pub const ERROR_CANCELLED: i32 = 1223;

//
// MessageId: ERROR_USER_MAPPED_FILE
//
// MessageText:
//
//  The requested operation cannot be performed on a file with a user-mapped section open.
//
pub const ERROR_USER_MAPPED_FILE: i32 = 1224;

//
// MessageId: ERROR_CONNECTION_REFUSED
//
// MessageText:
//
//  The remote system refused the network connection.
//
pub const ERROR_CONNECTION_REFUSED: i32 = 1225;

//
// MessageId: ERROR_GRACEFUL_DISCONNECT
//
// MessageText:
//
//  The network connection was gracefully closed.
//
pub const ERROR_GRACEFUL_DISCONNECT: i32 = 1226;

//
// MessageId: ERROR_ADDRESS_ALREADY_ASSOCIATED
//
// MessageText:
//
//  The network transport endpoint already has an address associated with it.
//
pub const ERROR_ADDRESS_ALREADY_ASSOCIATED: i32 = 1227;

//
// MessageId: ERROR_ADDRESS_NOT_ASSOCIATED
//
// MessageText:
//
//  An address has not yet been associated with the network endpoint.
//
pub const ERROR_ADDRESS_NOT_ASSOCIATED: i32 = 1228;

//
// MessageId: ERROR_CONNECTION_INVALID
//
// MessageText:
//
//  An operation was attempted on a nonexistent network connection.
//
pub const ERROR_CONNECTION_INVALID: i32 = 1229;

//
// MessageId: ERROR_CONNECTION_ACTIVE
//
// MessageText:
//
//  An invalid operation was attempted on an active network connection.
//
pub const ERROR_CONNECTION_ACTIVE: i32 = 1230;

//
// MessageId: ERROR_NETWORK_UNREACHABLE
//
// MessageText:
//
//  The network location cannot be reached. For information about network troubleshooting, see Windows Help.
//
pub const ERROR_NETWORK_UNREACHABLE: i32 = 1231;

//
// MessageId: ERROR_HOST_UNREACHABLE
//
// MessageText:
//
//  The network location cannot be reached. For information about network troubleshooting, see Windows Help.
//
pub const ERROR_HOST_UNREACHABLE: i32 = 1232;

//
// MessageId: ERROR_PROTOCOL_UNREACHABLE
//
// MessageText:
//
//  The network location cannot be reached. For information about network troubleshooting, see Windows Help.
//
pub const ERROR_PROTOCOL_UNREACHABLE: i32 = 1233;

//
// MessageId: ERROR_PORT_UNREACHABLE
//
// MessageText:
//
//  No service is operating at the destination network endpoint on the remote system.
//
pub const ERROR_PORT_UNREACHABLE: i32 = 1234;

//
// MessageId: ERROR_REQUEST_ABORTED
//
// MessageText:
//
//  The request was aborted.
//
pub const ERROR_REQUEST_ABORTED: i32 = 1235;

//
// MessageId: ERROR_CONNECTION_ABORTED
//
// MessageText:
//
//  The network connection was aborted by the local system.
//
pub const ERROR_CONNECTION_ABORTED: i32 = 1236;

//
// MessageId: ERROR_RETRY
//
// MessageText:
//
//  The operation could not be completed. A retry should be performed.
//
pub const ERROR_RETRY: i32 = 1237;

//
// MessageId: ERROR_CONNECTION_COUNT_LIMIT
//
// MessageText:
//
//  A connection to the server could not be made because the limit on the number of concurrent connections for this account has been reached.
//
pub const ERROR_CONNECTION_COUNT_LIMIT: i32 = 1238;

//
// MessageId: ERROR_LOGIN_TIME_RESTRICTION
//
// MessageText:
//
//  Attempting to log in during an unauthorized time of day for this account.
//
pub const ERROR_LOGIN_TIME_RESTRICTION: i32 = 1239;

//
// MessageId: ERROR_LOGIN_WKSTA_RESTRICTION
//
// MessageText:
//
//  The account is not authorized to log in from this station.
//
pub const ERROR_LOGIN_WKSTA_RESTRICTION: i32 = 1240;

//
// MessageId: ERROR_INCORRECT_ADDRESS
//
// MessageText:
//
//  The network address could not be used for the operation requested.
//
pub const ERROR_INCORRECT_ADDRESS: i32 = 1241;

//
// MessageId: ERROR_ALREADY_REGISTERED
//
// MessageText:
//
//  The service is already registered.
//
pub const ERROR_ALREADY_REGISTERED: i32 = 1242;

//
// MessageId: ERROR_SERVICE_NOT_FOUND
//
// MessageText:
//
//  The specified service does not exist.
//
pub const ERROR_SERVICE_NOT_FOUND: i32 = 1243;

//
// MessageId: ERROR_NOT_AUTHENTICATED
//
// MessageText:
//
//  The operation being requested was not performed because the user has not been authenticated.
//
pub const ERROR_NOT_AUTHENTICATED: i32 = 1244;

//
// MessageId: ERROR_NOT_LOGGED_ON
//
// MessageText:
//
//  The operation being requested was not performed because the user has not logged on to the network.
//  The specified service does not exist.
//
pub const ERROR_NOT_LOGGED_ON: i32 = 1245;

//
// MessageId: ERROR_CONTINUE
//
// MessageText:
//
//  Continue with work in progress.
//
pub const ERROR_CONTINUE: i32 = 1246; // dderror

//
// MessageId: ERROR_ALREADY_INITIALIZED
//
// MessageText:
//
//  An attempt was made to perform an initialization operation when initialization has already been completed.
//
pub const ERROR_ALREADY_INITIALIZED: i32 = 1247;

//
// MessageId: ERROR_NO_MORE_DEVICES
//
// MessageText:
//
//  No more local devices.
//
pub const ERROR_NO_MORE_DEVICES: i32 = 1248; // dderror

//
// MessageId: ERROR_NO_SUCH_SITE
//
// MessageText:
//
//  The specified site does not exist.
//
pub const ERROR_NO_SUCH_SITE: i32 = 1249;

//
// MessageId: ERROR_DOMAIN_CONTROLLER_EXISTS
//
// MessageText:
//
//  A domain controller with the specified name already exists.
//
pub const ERROR_DOMAIN_CONTROLLER_EXISTS: i32 = 1250;

//
// MessageId: ERROR_ONLY_IF_CONNECTED
//
// MessageText:
//
//  This operation is supported only when you are connected to the server.
//
pub const ERROR_ONLY_IF_CONNECTED: i32 = 1251;

//
// MessageId: ERROR_OVERRIDE_NOCHANGES
//
// MessageText:
//
//  The group policy framework should call the extension even if there are no changes.
//
pub const ERROR_OVERRIDE_NOCHANGES: i32 = 1252;

//
// MessageId: ERROR_BAD_USER_PROFILE
//
// MessageText:
//
//  The specified user does not have a valid profile.
//
pub const ERROR_BAD_USER_PROFILE: i32 = 1253;

//
// MessageId: ERROR_NOT_SUPPORTED_ON_SBS
//
// MessageText:
//
//  This operation is not supported on a computer running Windows Server 2003 for Small Business Server
//
pub const ERROR_NOT_SUPPORTED_ON_SBS: i32 = 1254;

//
// MessageId: ERROR_SERVER_SHUTDOWN_IN_PROGRESS
//
// MessageText:
//
//  The server machine is shutting down.
//
pub const ERROR_SERVER_SHUTDOWN_IN_PROGRESS: i32 = 1255;

//
// MessageId: ERROR_HOST_DOWN
//
// MessageText:
//
//  The remote system is not available. For information about network troubleshooting, see Windows Help.
//
pub const ERROR_HOST_DOWN: i32 = 1256;

//
// MessageId: ERROR_NON_ACCOUNT_SID
//
// MessageText:
//
//  The security identifier provided is not from an account domain.
//
pub const ERROR_NON_ACCOUNT_SID: i32 = 1257;

//
// MessageId: ERROR_NON_DOMAIN_SID
//
// MessageText:
//
//  The security identifier provided does not have a domain component.
//
pub const ERROR_NON_DOMAIN_SID: i32 = 1258;

//
// MessageId: ERROR_APPHELP_BLOCK
//
// MessageText:
//
//  AppHelp dialog canceled thus preventing the application from starting.
//
pub const ERROR_APPHELP_BLOCK: i32 = 1259;

//
// MessageId: ERROR_ACCESS_DISABLED_BY_POLICY
//
// MessageText:
//
//  Windows cannot open this program because it has been prevented by a software restriction policy. For more information, open Event Viewer or contact your system administrator.
//
pub const ERROR_ACCESS_DISABLED_BY_POLICY: i32 = 1260;

//
// MessageId: ERROR_REG_NAT_CONSUMPTION
//
// MessageText:
//
//  A program attempt to use an invalid register value.  Normally caused by an uninitialized register. This error is Itanium specific.
//
pub const ERROR_REG_NAT_CONSUMPTION: i32 = 1261;

//
// MessageId: ERROR_CSCSHARE_OFFLINE
//
// MessageText:
//
//  The share is currently offline or does not exist.
//
pub const ERROR_CSCSHARE_OFFLINE: i32 = 1262;

//
// MessageId: ERROR_PKINIT_FAILURE
//
// MessageText:
//
//  The kerberos protocol encountered an error while validating the
//  KDC certificate during smartcard logon.  There is more information in the
//  system event log.
//
pub const ERROR_PKINIT_FAILURE: i32 = 1263;

//
// MessageId: ERROR_SMARTCARD_SUBSYSTEM_FAILURE
//
// MessageText:
//
//  The kerberos protocol encountered an error while attempting to utilize
//  the smartcard subsystem.
//
pub const ERROR_SMARTCARD_SUBSYSTEM_FAILURE: i32 = 1264;

//
// MessageId: ERROR_DOWNGRADE_DETECTED
//
// MessageText:
//
//  The system detected a possible attempt to compromise security. Please ensure that you can contact the server that authenticated you.
//
pub const ERROR_DOWNGRADE_DETECTED: i32 = 1265;

//
// Do not use ID's 1266 - 1270 as the symbolicNames have been moved to SEC_E_*
//
//
// MessageId: ERROR_MACHINE_LOCKED
//
// MessageText:
//
//  The machine is locked and can not be shut down without the force option.
//
pub const ERROR_MACHINE_LOCKED: i32 = 1271;

//
// MessageId: ERROR_CALLBACK_SUPPLIED_INVALID_DATA
//
// MessageText:
//
//  An application-defined callback gave invalid data when called.
//
pub const ERROR_CALLBACK_SUPPLIED_INVALID_DATA: i32 = 1273;

//
// MessageId: ERROR_SYNC_FOREGROUND_REFRESH_REQUIRED
//
// MessageText:
//
//  The group policy framework should call the extension in the synchronous foreground policy refresh.
//
pub const ERROR_SYNC_FOREGROUND_REFRESH_REQUIRED: i32 = 1274;

//
// MessageId: ERROR_DRIVER_BLOCKED
//
// MessageText:
//
//  This driver has been blocked from loading
//
pub const ERROR_DRIVER_BLOCKED: i32 = 1275;

//
// MessageId: ERROR_INVALID_IMPORT_OF_NON_DLL
//
// MessageText:
//
//  A dynamic link library (DLL) referenced a module that was neither a DLL nor the process's executable image.
//
pub const ERROR_INVALID_IMPORT_OF_NON_DLL: i32 = 1276;

//
// MessageId: ERROR_ACCESS_DISABLED_WEBBLADE
//
// MessageText:
//
//  Windows cannot open this program since it has been disabled.
//
pub const ERROR_ACCESS_DISABLED_WEBBLADE: i32 = 1277;

//
// MessageId: ERROR_ACCESS_DISABLED_WEBBLADE_TAMPER
//
// MessageText:
//
//  Windows cannot open this program because the license enforcement system has been tampered with or become corrupted.
//
pub const ERROR_ACCESS_DISABLED_WEBBLADE_TAMPER: i32 = 1278;

//
// MessageId: ERROR_RECOVERY_FAILURE
//
// MessageText:
//
//  A transaction recover failed.
//
pub const ERROR_RECOVERY_FAILURE: i32 = 1279;

//
// MessageId: ERROR_ALREADY_FIBER
//
// MessageText:
//
//  The current thread has already been converted to a fiber.
//
pub const ERROR_ALREADY_FIBER: i32 = 1280;

//
// MessageId: ERROR_ALREADY_THREAD
//
// MessageText:
//
//  The current thread has already been converted from a fiber.
//
pub const ERROR_ALREADY_THREAD: i32 = 1281;

//
// MessageId: ERROR_STACK_BUFFER_OVERRUN
//
// MessageText:
//
//  The system detected an overrun of a stack-based buffer in this application.  This
//  overrun could potentially allow a malicious user to gain control of this application.
//
pub const ERROR_STACK_BUFFER_OVERRUN: i32 = 1282;

//
// MessageId: ERROR_PARAMETER_QUOTA_EXCEEDED
//
// MessageText:
//
//  Data present in one of the parameters is more than the function can operate on.
//
pub const ERROR_PARAMETER_QUOTA_EXCEEDED: i32 = 1283;

//
// MessageId: ERROR_DEBUGGER_INACTIVE
//
// MessageText:
//
//  An attempt to do an operation on a debug object failed because the object is in the process of being deleted.
//
pub const ERROR_DEBUGGER_INACTIVE: i32 = 1284;

//
// MessageId: ERROR_DELAY_LOAD_FAILED
//
// MessageText:
//
//  An attempt to delay-load a .dll or get a function address in a delay-loaded .dll failed.
//
pub const ERROR_DELAY_LOAD_FAILED: i32 = 1285;

//
// MessageId: ERROR_VDM_DISALLOWED
//
// MessageText:
//
//  %1 is a 16-bit application. You do not have permissions to execute 16-bit applications. Check your permissions with your system administrator.
//
pub const ERROR_VDM_DISALLOWED: i32 = 1286;

//
// MessageId: ERROR_UNIDENTIFIED_ERROR
//
// MessageText:
//
//  Insufficient information exists to identify the cause of failure.
//
pub const ERROR_UNIDENTIFIED_ERROR: i32 = 1287;

///////////////////////////
//
// Add new status codes before this point unless there is a component specific section below.
//
///////////////////////////

///////////////////////////
//                       //
// Security Status Codes //
//                       //
///////////////////////////

//
// MessageId: ERROR_NOT_ALL_ASSIGNED
//
// MessageText:
//
//  Not all privileges referenced are assigned to the caller.
//
pub const ERROR_NOT_ALL_ASSIGNED: i32 = 1300;

//
// MessageId: ERROR_SOME_NOT_MAPPED
//
// MessageText:
//
//  Some mapping between account names and security IDs was not done.
//
pub const ERROR_SOME_NOT_MAPPED: i32 = 1301;

//
// MessageId: ERROR_NO_QUOTAS_FOR_ACCOUNT
//
// MessageText:
//
//  No system quota limits are specifically set for this account.
//
pub const ERROR_NO_QUOTAS_FOR_ACCOUNT: i32 = 1302;

//
// MessageId: ERROR_LOCAL_USER_SESSION_KEY
//
// MessageText:
//
//  No encryption key is available. A well-known encryption key was returned.
//
pub const ERROR_LOCAL_USER_SESSION_KEY: i32 = 1303;

//
// MessageId: ERROR_NULL_LM_PASSWORD
//
// MessageText:
//
//  The password is too complex to be converted to a LAN Manager password. The LAN Manager password returned is a NULL string.
//
pub const ERROR_NULL_LM_PASSWORD: i32 = 1304;

//
// MessageId: ERROR_UNKNOWN_REVISION
//
// MessageText:
//
//  The revision level is unknown.
//
pub const ERROR_UNKNOWN_REVISION: i32 = 1305;

//
// MessageId: ERROR_REVISION_MISMATCH
//
// MessageText:
//
//  Indicates two revision levels are incompatible.
//
pub const ERROR_REVISION_MISMATCH: i32 = 1306;

//
// MessageId: ERROR_INVALID_OWNER
//
// MessageText:
//
//  This security ID may not be assigned as the owner of this object.
//
pub const ERROR_INVALID_OWNER: i32 = 1307;

//
// MessageId: ERROR_INVALID_PRIMARY_GROUP
//
// MessageText:
//
//  This security ID may not be assigned as the primary group of an object.
//
pub const ERROR_INVALID_PRIMARY_GROUP: i32 = 1308;

//
// MessageId: ERROR_NO_IMPERSONATION_TOKEN
//
// MessageText:
//
//  An attempt has been made to operate on an impersonation token by a thread that is not currently impersonating a client.
//
pub const ERROR_NO_IMPERSONATION_TOKEN: i32 = 1309;

//
// MessageId: ERROR_CANT_DISABLE_MANDATORY
//
// MessageText:
//
//  The group may not be disabled.
//
pub const ERROR_CANT_DISABLE_MANDATORY: i32 = 1310;

//
// MessageId: ERROR_NO_LOGON_SERVERS
//
// MessageText:
//
//  There are currently no logon servers available to service the logon request.
//
pub const ERROR_NO_LOGON_SERVERS: i32 = 1311;

//
// MessageId: ERROR_NO_SUCH_LOGON_SESSION
//
// MessageText:
//
//  A specified logon session does not exist. It may already have been terminated.
//
pub const ERROR_NO_SUCH_LOGON_SESSION: i32 = 1312;

//
// MessageId: ERROR_NO_SUCH_PRIVILEGE
//
// MessageText:
//
//  A specified privilege does not exist.
//
pub const ERROR_NO_SUCH_PRIVILEGE: i32 = 1313;

//
// MessageId: ERROR_PRIVILEGE_NOT_HELD
//
// MessageText:
//
//  A required privilege is not held by the client.
//
pub const ERROR_PRIVILEGE_NOT_HELD: i32 = 1314;

//
// MessageId: ERROR_INVALID_ACCOUNT_NAME
//
// MessageText:
//
//  The name provided is not a properly formed account name.
//
pub const ERROR_INVALID_ACCOUNT_NAME: i32 = 1315;

//
// MessageId: ERROR_USER_EXISTS
//
// MessageText:
//
//  The specified user already exists.
//
pub const ERROR_USER_EXISTS: i32 = 1316;

//
// MessageId: ERROR_NO_SUCH_USER
//
// MessageText:
//
//  The specified user does not exist.
//
pub const ERROR_NO_SUCH_USER: i32 = 1317;

//
// MessageId: ERROR_GROUP_EXISTS
//
// MessageText:
//
//  The specified group already exists.
//
pub const ERROR_GROUP_EXISTS: i32 = 1318;

//
// MessageId: ERROR_NO_SUCH_GROUP
//
// MessageText:
//
//  The specified group does not exist.
//
pub const ERROR_NO_SUCH_GROUP: i32 = 1319;

//
// MessageId: ERROR_MEMBER_IN_GROUP
//
// MessageText:
//
//  Either the specified user account is already a member of the specified group, or the specified group cannot be deleted because it contains a member.
//
pub const ERROR_MEMBER_IN_GROUP: i32 = 1320;

//
// MessageId: ERROR_MEMBER_NOT_IN_GROUP
//
// MessageText:
//
//  The specified user account is not a member of the specified group account.
//
pub const ERROR_MEMBER_NOT_IN_GROUP: i32 = 1321;

//
// MessageId: ERROR_LAST_ADMIN
//
// MessageText:
//
//  The last remaining administration account cannot be disabled or deleted.
//
pub const ERROR_LAST_ADMIN: i32 = 1322;

//
// MessageId: ERROR_WRONG_PASSWORD
//
// MessageText:
//
//  Unable to update the password. The value provided as the current password is incorrect.
//
pub const ERROR_WRONG_PASSWORD: i32 = 1323;

//
// MessageId: ERROR_ILL_FORMED_PASSWORD
//
// MessageText:
//
//  Unable to update the password. The value provided for the new password contains values that are not allowed in passwords.
//
pub const ERROR_ILL_FORMED_PASSWORD: i32 = 1324;

//
// MessageId: ERROR_PASSWORD_RESTRICTION
//
// MessageText:
//
//  Unable to update the password. The value provided for the new password does not meet the length, complexity, or history requirement of the domain.
//
pub const ERROR_PASSWORD_RESTRICTION: i32 = 1325;

//
// MessageId: ERROR_LOGON_FAILURE
//
// MessageText:
//
//  Logon failure: unknown user name or bad password.
//
pub const ERROR_LOGON_FAILURE: i32 = 1326;

//
// MessageId: ERROR_ACCOUNT_RESTRICTION
//
// MessageText:
//
//  Logon failure: user account restriction.  Possible reasons are blank passwords not allowed, logon hour restrictions, or a policy restriction has been enforced.
//
pub const ERROR_ACCOUNT_RESTRICTION: i32 = 1327;

//
// MessageId: ERROR_INVALID_LOGON_HOURS
//
// MessageText:
//
//  Logon failure: account logon time restriction violation.
//
pub const ERROR_INVALID_LOGON_HOURS: i32 = 1328;

//
// MessageId: ERROR_INVALID_WORKSTATION
//
// MessageText:
//
//  Logon failure: user not allowed to log on to this computer.
//
pub const ERROR_INVALID_WORKSTATION: i32 = 1329;

//
// MessageId: ERROR_PASSWORD_EXPIRED
//
// MessageText:
//
//  Logon failure: the specified account password has expired.
//
pub const ERROR_PASSWORD_EXPIRED: i32 = 1330;

//
// MessageId: ERROR_ACCOUNT_DISABLED
//
// MessageText:
//
//  Logon failure: account currently disabled.
//
pub const ERROR_ACCOUNT_DISABLED: i32 = 1331;

//
// MessageId: ERROR_NONE_MAPPED
//
// MessageText:
//
//  No mapping between account names and security IDs was done.
//
pub const ERROR_NONE_MAPPED: i32 = 1332;

//
// MessageId: ERROR_TOO_MANY_LUIDS_REQUESTED
//
// MessageText:
//
//  Too many local user identifiers (LUIDs) were requested at one time.
//
pub const ERROR_TOO_MANY_LUIDS_REQUESTED: i32 = 1333;

//
// MessageId: ERROR_LUIDS_EXHAUSTED
//
// MessageText:
//
//  No more local user identifiers (LUIDs) are available.
//
pub const ERROR_LUIDS_EXHAUSTED: i32 = 1334;

//
// MessageId: ERROR_INVALID_SUB_AUTHORITY
//
// MessageText:
//
//  The subauthority part of a security ID is invalid for this particular use.
//
pub const ERROR_INVALID_SUB_AUTHORITY: i32 = 1335;

//
// MessageId: ERROR_INVALID_ACL
//
// MessageText:
//
//  The access control list (ACL) structure is invalid.
//
pub const ERROR_INVALID_ACL: i32 = 1336;

//
// MessageId: ERROR_INVALID_SID
//
// MessageText:
//
//  The security ID structure is invalid.
//
pub const ERROR_INVALID_SID: i32 = 1337;

//
// MessageId: ERROR_INVALID_SECURITY_DESCR
//
// MessageText:
//
//  The security descriptor structure is invalid.
//
pub const ERROR_INVALID_SECURITY_DESCR: i32 = 1338;

//
// MessageId: ERROR_BAD_INHERITANCE_ACL
//
// MessageText:
//
//  The inherited access control list (ACL) or access control entry (ACE) could not be built.
//
pub const ERROR_BAD_INHERITANCE_ACL: i32 = 1340;

//
// MessageId: ERROR_SERVER_DISABLED
//
// MessageText:
//
//  The server is currently disabled.
//
pub const ERROR_SERVER_DISABLED: i32 = 1341;

//
// MessageId: ERROR_SERVER_NOT_DISABLED
//
// MessageText:
//
//  The server is currently enabled.
//
pub const ERROR_SERVER_NOT_DISABLED: i32 = 1342;

//
// MessageId: ERROR_INVALID_ID_AUTHORITY
//
// MessageText:
//
//  The value provided was an invalid value for an identifier authority.
//
pub const ERROR_INVALID_ID_AUTHORITY: i32 = 1343;

//
// MessageId: ERROR_ALLOTTED_SPACE_EXCEEDED
//
// MessageText:
//
//  No more memory is available for security information updates.
//
pub const ERROR_ALLOTTED_SPACE_EXCEEDED: i32 = 1344;

//
// MessageId: ERROR_INVALID_GROUP_ATTRIBUTES
//
// MessageText:
//
//  The specified attributes are invalid, or incompatible with the attributes for the group as a whole.
//
pub const ERROR_INVALID_GROUP_ATTRIBUTES: i32 = 1345;

//
// MessageId: ERROR_BAD_IMPERSONATION_LEVEL
//
// MessageText:
//
//  Either a required impersonation level was not provided, or the provided impersonation level is invalid.
//
pub const ERROR_BAD_IMPERSONATION_LEVEL: i32 = 1346;

//
// MessageId: ERROR_CANT_OPEN_ANONYMOUS
//
// MessageText:
//
//  Cannot open an anonymous level security token.
//
pub const ERROR_CANT_OPEN_ANONYMOUS: i32 = 1347;

//
// MessageId: ERROR_BAD_VALIDATION_CLASS
//
// MessageText:
//
//  The validation information class requested was invalid.
//
pub const ERROR_BAD_VALIDATION_CLASS: i32 = 1348;

//
// MessageId: ERROR_BAD_TOKEN_TYPE
//
// MessageText:
//
//  The type of the token is inappropriate for its attempted use.
//
pub const ERROR_BAD_TOKEN_TYPE: i32 = 1349;

//
// MessageId: ERROR_NO_SECURITY_ON_OBJECT
//
// MessageText:
//
//  Unable to perform a security operation on an object that has no associated security.
//
pub const ERROR_NO_SECURITY_ON_OBJECT: i32 = 1350;

//
// MessageId: ERROR_CANT_ACCESS_DOMAIN_INFO
//
// MessageText:
//
//  Configuration information could not be read from the domain controller, either because the machine is unavailable, or access has been denied.
//
pub const ERROR_CANT_ACCESS_DOMAIN_INFO: i32 = 1351;

//
// MessageId: ERROR_INVALID_SERVER_STATE
//
// MessageText:
//
//  The security account manager (SAM) or local security authority (LSA) server was in the wrong state to perform the security operation.
//
pub const ERROR_INVALID_SERVER_STATE: i32 = 1352;

//
// MessageId: ERROR_INVALID_DOMAIN_STATE
//
// MessageText:
//
//  The domain was in the wrong state to perform the security operation.
//
pub const ERROR_INVALID_DOMAIN_STATE: i32 = 1353;

//
// MessageId: ERROR_INVALID_DOMAIN_ROLE
//
// MessageText:
//
//  This operation is only allowed for the Primary Domain Controller of the domain.
//
pub const ERROR_INVALID_DOMAIN_ROLE: i32 = 1354;

//
// MessageId: ERROR_NO_SUCH_DOMAIN
//
// MessageText:
//
//  The specified domain either does not exist or could not be contacted.
//
pub const ERROR_NO_SUCH_DOMAIN: i32 = 1355;

//
// MessageId: ERROR_DOMAIN_EXISTS
//
// MessageText:
//
//  The specified domain already exists.
//
pub const ERROR_DOMAIN_EXISTS: i32 = 1356;

//
// MessageId: ERROR_DOMAIN_LIMIT_EXCEEDED
//
// MessageText:
//
//  An attempt was made to exceed the limit on the number of domains per server.
//
pub const ERROR_DOMAIN_LIMIT_EXCEEDED: i32 = 1357;

//
// MessageId: ERROR_INTERNAL_DB_CORRUPTION
//
// MessageText:
//
//  Unable to complete the requested operation because of either a catastrophic media failure or a data structure corruption on the disk.
//
pub const ERROR_INTERNAL_DB_CORRUPTION: i32 = 1358;

//
// MessageId: ERROR_INTERNAL_ERROR
//
// MessageText:
//
//  An internal error occurred.
//
pub const ERROR_INTERNAL_ERROR: i32 = 1359;

//
// MessageId: ERROR_GENERIC_NOT_MAPPED
//
// MessageText:
//
//  Generic access types were contained in an access mask which should already be mapped to nongeneric types.
//
pub const ERROR_GENERIC_NOT_MAPPED: i32 = 1360;

//
// MessageId: ERROR_BAD_DESCRIPTOR_FORMAT
//
// MessageText:
//
//  A security descriptor is not in the right format (absolute or self-relative).
//
pub const ERROR_BAD_DESCRIPTOR_FORMAT: i32 = 1361;

//
// MessageId: ERROR_NOT_LOGON_PROCESS
//
// MessageText:
//
//  The requested action is restricted for use by logon processes only. The calling process has not registered as a logon process.
//
pub const ERROR_NOT_LOGON_PROCESS: i32 = 1362;

//
// MessageId: ERROR_LOGON_SESSION_EXISTS
//
// MessageText:
//
//  Cannot start a new logon session with an ID that is already in use.
//
pub const ERROR_LOGON_SESSION_EXISTS: i32 = 1363;

//
// MessageId: ERROR_NO_SUCH_PACKAGE
//
// MessageText:
//
//  A specified authentication package is unknown.
//
pub const ERROR_NO_SUCH_PACKAGE: i32 = 1364;

//
// MessageId: ERROR_BAD_LOGON_SESSION_STATE
//
// MessageText:
//
//  The logon session is not in a state that is consistent with the requested operation.
//
pub const ERROR_BAD_LOGON_SESSION_STATE: i32 = 1365;

//
// MessageId: ERROR_LOGON_SESSION_COLLISION
//
// MessageText:
//
//  The logon session ID is already in use.
//
pub const ERROR_LOGON_SESSION_COLLISION: i32 = 1366;

//
// MessageId: ERROR_INVALID_LOGON_TYPE
//
// MessageText:
//
//  A logon request contained an invalid logon type value.
//
pub const ERROR_INVALID_LOGON_TYPE: i32 = 1367;

//
// MessageId: ERROR_CANNOT_IMPERSONATE
//
// MessageText:
//
//  Unable to impersonate using a named pipe until data has been read from that pipe.
//
pub const ERROR_CANNOT_IMPERSONATE: i32 = 1368;

//
// MessageId: ERROR_RXACT_INVALID_STATE
//
// MessageText:
//
//  The transaction state of a registry subtree is incompatible with the requested operation.
//
pub const ERROR_RXACT_INVALID_STATE: i32 = 1369;

//
// MessageId: ERROR_RXACT_COMMIT_FAILURE
//
// MessageText:
//
//  An internal security database corruption has been encountered.
//
pub const ERROR_RXACT_COMMIT_FAILURE: i32 = 1370;

//
// MessageId: ERROR_SPECIAL_ACCOUNT
//
// MessageText:
//
//  Cannot perform this operation on built-in accounts.
//
pub const ERROR_SPECIAL_ACCOUNT: i32 = 1371;

//
// MessageId: ERROR_SPECIAL_GROUP
//
// MessageText:
//
//  Cannot perform this operation on this built-in special group.
//
pub const ERROR_SPECIAL_GROUP: i32 = 1372;

//
// MessageId: ERROR_SPECIAL_USER
//
// MessageText:
//
//  Cannot perform this operation on this built-in special user.
//
pub const ERROR_SPECIAL_USER: i32 = 1373;

//
// MessageId: ERROR_MEMBERS_PRIMARY_GROUP
//
// MessageText:
//
//  The user cannot be removed from a group because the group is currently the user's primary group.
//
pub const ERROR_MEMBERS_PRIMARY_GROUP: i32 = 1374;

//
// MessageId: ERROR_TOKEN_ALREADY_IN_USE
//
// MessageText:
//
//  The token is already in use as a primary token.
//
pub const ERROR_TOKEN_ALREADY_IN_USE: i32 = 1375;

//
// MessageId: ERROR_NO_SUCH_ALIAS
//
// MessageText:
//
//  The specified local group does not exist.
//
pub const ERROR_NO_SUCH_ALIAS: i32 = 1376;

//
// MessageId: ERROR_MEMBER_NOT_IN_ALIAS
//
// MessageText:
//
//  The specified account name is not a member of the local group.
//
pub const ERROR_MEMBER_NOT_IN_ALIAS: i32 = 1377;

//
// MessageId: ERROR_MEMBER_IN_ALIAS
//
// MessageText:
//
//  The specified account name is already a member of the local group.
//
pub const ERROR_MEMBER_IN_ALIAS: i32 = 1378;

//
// MessageId: ERROR_ALIAS_EXISTS
//
// MessageText:
//
//  The specified local group already exists.
//
pub const ERROR_ALIAS_EXISTS: i32 = 1379;

//
// MessageId: ERROR_LOGON_NOT_GRANTED
//
// MessageText:
//
//  Logon failure: the user has not been granted the requested logon type at this computer.
//
pub const ERROR_LOGON_NOT_GRANTED: i32 = 1380;

//
// MessageId: ERROR_TOO_MANY_SECRETS
//
// MessageText:
//
//  The maximum number of secrets that may be stored in a single system has been exceeded.
//
pub const ERROR_TOO_MANY_SECRETS: i32 = 1381;

//
// MessageId: ERROR_SECRET_TOO_LONG
//
// MessageText:
//
//  The length of a secret exceeds the maximum length allowed.
//
pub const ERROR_SECRET_TOO_LONG: i32 = 1382;

//
// MessageId: ERROR_INTERNAL_DB_ERROR
//
// MessageText:
//
//  The local security authority database contains an internal inconsistency.
//
pub const ERROR_INTERNAL_DB_ERROR: i32 = 1383;

//
// MessageId: ERROR_TOO_MANY_CONTEXT_IDS
//
// MessageText:
//
//  During a logon attempt, the user's security context accumulated too many security IDs.
//
pub const ERROR_TOO_MANY_CONTEXT_IDS: i32 = 1384;

//
// MessageId: ERROR_LOGON_TYPE_NOT_GRANTED
//
// MessageText:
//
//  Logon failure: the user has not been granted the requested logon type at this computer.
//
pub const ERROR_LOGON_TYPE_NOT_GRANTED: i32 = 1385;

//
// MessageId: ERROR_NT_CROSS_ENCRYPTION_REQUIRED
//
// MessageText:
//
//  A cross-encrypted password is necessary to change a user password.
//
pub const ERROR_NT_CROSS_ENCRYPTION_REQUIRED: i32 = 1386;

//
// MessageId: ERROR_NO_SUCH_MEMBER
//
// MessageText:
//
//  A member could not be added to or removed from the local group because the member does not exist.
//
pub const ERROR_NO_SUCH_MEMBER: i32 = 1387;

//
// MessageId: ERROR_INVALID_MEMBER
//
// MessageText:
//
//  A new member could not be added to a local group because the member has the wrong account type.
//
pub const ERROR_INVALID_MEMBER: i32 = 1388;

//
// MessageId: ERROR_TOO_MANY_SIDS
//
// MessageText:
//
//  Too many security IDs have been specified.
//
pub const ERROR_TOO_MANY_SIDS: i32 = 1389;

//
// MessageId: ERROR_LM_CROSS_ENCRYPTION_REQUIRED
//
// MessageText:
//
//  A cross-encrypted password is necessary to change this user password.
//
pub const ERROR_LM_CROSS_ENCRYPTION_REQUIRED: i32 = 1390;

//
// MessageId: ERROR_NO_INHERITANCE
//
// MessageText:
//
//  Indicates an ACL contains no inheritable components.
//
pub const ERROR_NO_INHERITANCE: i32 = 1391;

//
// MessageId: ERROR_FILE_CORRUPT
//
// MessageText:
//
//  The file or directory is corrupted and unreadable.
//
pub const ERROR_FILE_CORRUPT: i32 = 1392;

//
// MessageId: ERROR_DISK_CORRUPT
//
// MessageText:
//
//  The disk structure is corrupted and unreadable.
//
pub const ERROR_DISK_CORRUPT: i32 = 1393;

//
// MessageId: ERROR_NO_USER_SESSION_KEY
//
// MessageText:
//
//  There is no user session key for the specified logon session.
//
pub const ERROR_NO_USER_SESSION_KEY: i32 = 1394;

//
// MessageId: ERROR_LICENSE_QUOTA_EXCEEDED
//
// MessageText:
//
//  The service being accessed is licensed for a particular number of connections.
//  No more connections can be made to the service at this time because there are already as many connections as the service can accept.
//
pub const ERROR_LICENSE_QUOTA_EXCEEDED: i32 = 1395;

//
// MessageId: ERROR_WRONG_TARGET_NAME
//
// MessageText:
//
//  Logon Failure: The target account name is incorrect.
//
pub const ERROR_WRONG_TARGET_NAME: i32 = 1396;

//
// MessageId: ERROR_MUTUAL_AUTH_FAILED
//
// MessageText:
//
//  Mutual Authentication failed. The server's password is out of date at the domain controller.
//
pub const ERROR_MUTUAL_AUTH_FAILED: i32 = 1397;

//
// MessageId: ERROR_TIME_SKEW
//
// MessageText:
//
//  There is a time and/or date difference between the client and server.
//
pub const ERROR_TIME_SKEW: i32 = 1398;

//
// MessageId: ERROR_CURRENT_DOMAIN_NOT_ALLOWED
//
// MessageText:
//
//  This operation can not be performed on the current domain.
//
pub const ERROR_CURRENT_DOMAIN_NOT_ALLOWED: i32 = 1399;

// End of security error codes

///////////////////////////
//                       //
// WinUser Error Codes   //
//                       //
///////////////////////////

//
// MessageId: ERROR_INVALID_WINDOW_HANDLE
//
// MessageText:
//
//  Invalid window handle.
//
pub const ERROR_INVALID_WINDOW_HANDLE: i32 = 1400;

//
// MessageId: ERROR_INVALID_MENU_HANDLE
//
// MessageText:
//
//  Invalid menu handle.
//
pub const ERROR_INVALID_MENU_HANDLE: i32 = 1401;

//
// MessageId: ERROR_INVALID_CURSOR_HANDLE
//
// MessageText:
//
//  Invalid cursor handle.
//
pub const ERROR_INVALID_CURSOR_HANDLE: i32 = 1402;

//
// MessageId: ERROR_INVALID_ACCEL_HANDLE
//
// MessageText:
//
//  Invalid accelerator table handle.
//
pub const ERROR_INVALID_ACCEL_HANDLE: i32 = 1403;

//
// MessageId: ERROR_INVALID_HOOK_HANDLE
//
// MessageText:
//
//  Invalid hook handle.
//
pub const ERROR_INVALID_HOOK_HANDLE: i32 = 1404;

//
// MessageId: ERROR_INVALID_DWP_HANDLE
//
// MessageText:
//
//  Invalid handle to a multiple-window position structure.
//
pub const ERROR_INVALID_DWP_HANDLE: i32 = 1405;

//
// MessageId: ERROR_TLW_WITH_WSCHILD
//
// MessageText:
//
//  Cannot create a top-level child window.
//
pub const ERROR_TLW_WITH_WSCHILD: i32 = 1406;

//
// MessageId: ERROR_CANNOT_FIND_WND_CLASS
//
// MessageText:
//
//  Cannot find window class.
//
pub const ERROR_CANNOT_FIND_WND_CLASS: i32 = 1407;

//
// MessageId: ERROR_WINDOW_OF_OTHER_THREAD
//
// MessageText:
//
//  Invalid window; it belongs to other thread.
//
pub const ERROR_WINDOW_OF_OTHER_THREAD: i32 = 1408;

//
// MessageId: ERROR_HOTKEY_ALREADY_REGISTERED
//
// MessageText:
//
//  Hot key is already registered.
//
pub const ERROR_HOTKEY_ALREADY_REGISTERED: i32 = 1409;

//
// MessageId: ERROR_CLASS_ALREADY_EXISTS
//
// MessageText:
//
//  Class already exists.
//
pub const ERROR_CLASS_ALREADY_EXISTS: i32 = 1410;

//
// MessageId: ERROR_CLASS_DOES_NOT_EXIST
//
// MessageText:
//
//  Class does not exist.
//
pub const ERROR_CLASS_DOES_NOT_EXIST: i32 = 1411;

//
// MessageId: ERROR_CLASS_HAS_WINDOWS
//
// MessageText:
//
//  Class still has open windows.
//
pub const ERROR_CLASS_HAS_WINDOWS: i32 = 1412;

//
// MessageId: ERROR_INVALID_INDEX
//
// MessageText:
//
//  Invalid index.
//
pub const ERROR_INVALID_INDEX: i32 = 1413;

//
// MessageId: ERROR_INVALID_ICON_HANDLE
//
// MessageText:
//
//  Invalid icon handle.
//
pub const ERROR_INVALID_ICON_HANDLE: i32 = 1414;

//
// MessageId: ERROR_PRIVATE_DIALOG_INDEX
//
// MessageText:
//
//  Using private DIALOG window words.
//
pub const ERROR_PRIVATE_DIALOG_INDEX: i32 = 1415;

//
// MessageId: ERROR_LISTBOX_ID_NOT_FOUND
//
// MessageText:
//
//  The list box identifier was not found.
//
pub const ERROR_LISTBOX_ID_NOT_FOUND: i32 = 1416;

//
// MessageId: ERROR_NO_WILDCARD_CHARACTERS
//
// MessageText:
//
//  No wildcards were found.
//
pub const ERROR_NO_WILDCARD_CHARACTERS: i32 = 1417;

//
// MessageId: ERROR_CLIPBOARD_NOT_OPEN
//
// MessageText:
//
//  Thread does not have a clipboard open.
//
pub const ERROR_CLIPBOARD_NOT_OPEN: i32 = 1418;

//
// MessageId: ERROR_HOTKEY_NOT_REGISTERED
//
// MessageText:
//
//  Hot key is not registered.
//
pub const ERROR_HOTKEY_NOT_REGISTERED: i32 = 1419;

//
// MessageId: ERROR_WINDOW_NOT_DIALOG
//
// MessageText:
//
//  The window is not a valid dialog window.
//
pub const ERROR_WINDOW_NOT_DIALOG: i32 = 1420;

//
// MessageId: ERROR_CONTROL_ID_NOT_FOUND
//
// MessageText:
//
//  Control ID not found.
//
pub const ERROR_CONTROL_ID_NOT_FOUND: i32 = 1421;

//
// MessageId: ERROR_INVALID_COMBOBOX_MESSAGE
//
// MessageText:
//
//  Invalid message for a combo box because it does not have an edit control.
//
pub const ERROR_INVALID_COMBOBOX_MESSAGE: i32 = 1422;

//
// MessageId: ERROR_WINDOW_NOT_COMBOBOX
//
// MessageText:
//
//  The window is not a combo box.
//
pub const ERROR_WINDOW_NOT_COMBOBOX: i32 = 1423;

//
// MessageId: ERROR_INVALID_EDIT_HEIGHT
//
// MessageText:
//
//  Height must be less than 256.
//
pub const ERROR_INVALID_EDIT_HEIGHT: i32 = 1424;

//
// MessageId: ERROR_DC_NOT_FOUND
//
// MessageText:
//
//  Invalid device context (DC) handle.
//
pub const ERROR_DC_NOT_FOUND: i32 = 1425;

//
// MessageId: ERROR_INVALID_HOOK_FILTER
//
// MessageText:
//
//  Invalid hook procedure type.
//
pub const ERROR_INVALID_HOOK_FILTER: i32 = 1426;

//
// MessageId: ERROR_INVALID_FILTER_PROC
//
// MessageText:
//
//  Invalid hook procedure.
//
pub const ERROR_INVALID_FILTER_PROC: i32 = 1427;

//
// MessageId: ERROR_HOOK_NEEDS_HMOD
//
// MessageText:
//
//  Cannot set nonlocal hook without a module handle.
//
pub const ERROR_HOOK_NEEDS_HMOD: i32 = 1428;

//
// MessageId: ERROR_GLOBAL_ONLY_HOOK
//
// MessageText:
//
//  This hook procedure can only be set globally.
//
pub const ERROR_GLOBAL_ONLY_HOOK: i32 = 1429;

//
// MessageId: ERROR_JOURNAL_HOOK_SET
//
// MessageText:
//
//  The journal hook procedure is already installed.
//
pub const ERROR_JOURNAL_HOOK_SET: i32 = 1430;

//
// MessageId: ERROR_HOOK_NOT_INSTALLED
//
// MessageText:
//
//  The hook procedure is not installed.
//
pub const ERROR_HOOK_NOT_INSTALLED: i32 = 1431;

//
// MessageId: ERROR_INVALID_LB_MESSAGE
//
// MessageText:
//
//  Invalid message for single-selection list box.
//
pub const ERROR_INVALID_LB_MESSAGE: i32 = 1432;

//
// MessageId: ERROR_SETCOUNT_ON_BAD_LB
//
// MessageText:
//
//  LB_SETCOUNT sent to non-lazy list box.
//
pub const ERROR_SETCOUNT_ON_BAD_LB: i32 = 1433;

//
// MessageId: ERROR_LB_WITHOUT_TABSTOPS
//
// MessageText:
//
//  This list box does not support tab stops.
//
pub const ERROR_LB_WITHOUT_TABSTOPS: i32 = 1434;

//
// MessageId: ERROR_DESTROY_OBJECT_OF_OTHER_THREAD
//
// MessageText:
//
//  Cannot destroy object created by another thread.
//
pub const ERROR_DESTROY_OBJECT_OF_OTHER_THREAD: i32 = 1435;

//
// MessageId: ERROR_CHILD_WINDOW_MENU
//
// MessageText:
//
//  Child windows cannot have menus.
//
pub const ERROR_CHILD_WINDOW_MENU: i32 = 1436;

//
// MessageId: ERROR_NO_SYSTEM_MENU
//
// MessageText:
//
//  The window does not have a system menu.
//
pub const ERROR_NO_SYSTEM_MENU: i32 = 1437;

//
// MessageId: ERROR_INVALID_MSGBOX_STYLE
//
// MessageText:
//
//  Invalid message box style.
//
pub const ERROR_INVALID_MSGBOX_STYLE: i32 = 1438;

//
// MessageId: ERROR_INVALID_SPI_VALUE
//
// MessageText:
//
//  Invalid system-wide (SPI_*) parameter.
//
pub const ERROR_INVALID_SPI_VALUE: i32 = 1439;

//
// MessageId: ERROR_SCREEN_ALREADY_LOCKED
//
// MessageText:
//
//  Screen already locked.
//
pub const ERROR_SCREEN_ALREADY_LOCKED: i32 = 1440;

//
// MessageId: ERROR_HWNDS_HAVE_DIFF_PARENT
//
// MessageText:
//
//  All handles to windows in a multiple-window position structure must have the same parent.
//
pub const ERROR_HWNDS_HAVE_DIFF_PARENT: i32 = 1441;

//
// MessageId: ERROR_NOT_CHILD_WINDOW
//
// MessageText:
//
//  The window is not a child window.
//
pub const ERROR_NOT_CHILD_WINDOW: i32 = 1442;

//
// MessageId: ERROR_INVALID_GW_COMMAND
//
// MessageText:
//
//  Invalid GW_* command.
//
pub const ERROR_INVALID_GW_COMMAND: i32 = 1443;

//
// MessageId: ERROR_INVALID_THREAD_ID
//
// MessageText:
//
//  Invalid thread identifier.
//
pub const ERROR_INVALID_THREAD_ID: i32 = 1444;

//
// MessageId: ERROR_NON_MDICHILD_WINDOW
//
// MessageText:
//
//  Cannot process a message from a window that is not a multiple document interface (MDI) window.
//
pub const ERROR_NON_MDICHILD_WINDOW: i32 = 1445;

//
// MessageId: ERROR_POPUP_ALREADY_ACTIVE
//
// MessageText:
//
//  Popup menu already active.
//
pub const ERROR_POPUP_ALREADY_ACTIVE: i32 = 1446;

//
// MessageId: ERROR_NO_SCROLLBARS
//
// MessageText:
//
//  The window does not have scroll bars.
//
pub const ERROR_NO_SCROLLBARS: i32 = 1447;

//
// MessageId: ERROR_INVALID_SCROLLBAR_RANGE
//
// MessageText:
//
//  Scroll bar range cannot be greater than MAXLONG.
//
pub const ERROR_INVALID_SCROLLBAR_RANGE: i32 = 1448;

//
// MessageId: ERROR_INVALID_SHOWWIN_COMMAND
//
// MessageText:
//
//  Cannot show or remove the window in the way specified.
//
pub const ERROR_INVALID_SHOWWIN_COMMAND: i32 = 1449;

//
// MessageId: ERROR_NO_SYSTEM_RESOURCES
//
// MessageText:
//
//  Insufficient system resources exist to complete the requested service.
//
pub const ERROR_NO_SYSTEM_RESOURCES: i32 = 1450;

//
// MessageId: ERROR_NONPAGED_SYSTEM_RESOURCES
//
// MessageText:
//
//  Insufficient system resources exist to complete the requested service.
//
pub const ERROR_NONPAGED_SYSTEM_RESOURCES: i32 = 1451;

//
// MessageId: ERROR_PAGED_SYSTEM_RESOURCES
//
// MessageText:
//
//  Insufficient system resources exist to complete the requested service.
//
pub const ERROR_PAGED_SYSTEM_RESOURCES: i32 = 1452;

//
// MessageId: ERROR_WORKING_SET_QUOTA
//
// MessageText:
//
//  Insufficient quota to complete the requested service.
//
pub const ERROR_WORKING_SET_QUOTA: i32 = 1453;

//
// MessageId: ERROR_PAGEFILE_QUOTA
//
// MessageText:
//
//  Insufficient quota to complete the requested service.
//
pub const ERROR_PAGEFILE_QUOTA: i32 = 1454;

//
// MessageId: ERROR_COMMITMENT_LIMIT
//
// MessageText:
//
//  The paging file is too small for this operation to complete.
//
pub const ERROR_COMMITMENT_LIMIT: i32 = 1455;

//
// MessageId: ERROR_MENU_ITEM_NOT_FOUND
//
// MessageText:
//
//  A menu item was not found.
//
pub const ERROR_MENU_ITEM_NOT_FOUND: i32 = 1456;

//
// MessageId: ERROR_INVALID_KEYBOARD_HANDLE
//
// MessageText:
//
//  Invalid keyboard layout handle.
//
pub const ERROR_INVALID_KEYBOARD_HANDLE: i32 = 1457;

//
// MessageId: ERROR_HOOK_TYPE_NOT_ALLOWED
//
// MessageText:
//
//  Hook type not allowed.
//
pub const ERROR_HOOK_TYPE_NOT_ALLOWED: i32 = 1458;

//
// MessageId: ERROR_REQUIRES_INTERACTIVE_WINDOWSTATION
//
// MessageText:
//
//  This operation requires an interactive window station.
//
pub const ERROR_REQUIRES_INTERACTIVE_WINDOWSTATION: i32 = 1459;

//
// MessageId: ERROR_TIMEOUT
//
// MessageText:
//
//  This operation returned because the timeout period expired.
//
pub const ERROR_TIMEOUT: i32 = 1460;

//
// MessageId: ERROR_INVALID_MONITOR_HANDLE
//
// MessageText:
//
//  Invalid monitor handle.
//
pub const ERROR_INVALID_MONITOR_HANDLE: i32 = 1461;

//
// MessageId: ERROR_INCORRECT_SIZE
//
// MessageText:
//
//  Incorrect size argument.
//
pub const ERROR_INCORRECT_SIZE: i32 = 1462;

// End of WinUser error codes

///////////////////////////
//                       //
// Eventlog Status Codes //
//                       //
///////////////////////////

//
// MessageId: ERROR_EVENTLOG_FILE_CORRUPT
//
// MessageText:
//
//  The event log file is corrupted.
//
pub const ERROR_EVENTLOG_FILE_CORRUPT: i32 = 1500;

//
// MessageId: ERROR_EVENTLOG_CANT_START
//
// MessageText:
//
//  No event log file could be opened, so the event logging service did not start.
//
pub const ERROR_EVENTLOG_CANT_START: i32 = 1501;

//
// MessageId: ERROR_LOG_FILE_FULL
//
// MessageText:
//
//  The event log file is full.
//
pub const ERROR_LOG_FILE_FULL: i32 = 1502;

//
// MessageId: ERROR_EVENTLOG_FILE_CHANGED
//
// MessageText:
//
//  The event log file has changed between read operations.
//
pub const ERROR_EVENTLOG_FILE_CHANGED: i32 = 1503;

// End of eventlog error codes

///////////////////////////
//                       //
// MSI Error Codes       //
//                       //
///////////////////////////

//
// MessageId: ERROR_INSTALL_SERVICE_FAILURE
//
// MessageText:
//
//  The Windows Installer Service could not be accessed. This can occur if you are running Windows in safe mode, or if the Windows Installer is not correctly installed. Contact your support personnel for assistance.
//
pub const ERROR_INSTALL_SERVICE_FAILURE: i32 = 1601;

//
// MessageId: ERROR_INSTALL_USEREXIT
//
// MessageText:
//
//  User cancelled installation.
//
pub const ERROR_INSTALL_USEREXIT: i32 = 1602;

//
// MessageId: ERROR_INSTALL_FAILURE
//
// MessageText:
//
//  Fatal error during installation.
//
pub const ERROR_INSTALL_FAILURE: i32 = 1603;

//
// MessageId: ERROR_INSTALL_SUSPEND
//
// MessageText:
//
//  Installation suspended, incomplete.
//
pub const ERROR_INSTALL_SUSPEND: i32 = 1604;

//
// MessageId: ERROR_UNKNOWN_PRODUCT
//
// MessageText:
//
//  This action is only valid for products that are currently installed.
//
pub const ERROR_UNKNOWN_PRODUCT: i32 = 1605;

//
// MessageId: ERROR_UNKNOWN_FEATURE
//
// MessageText:
//
//  Feature ID not registered.
//
pub const ERROR_UNKNOWN_FEATURE: i32 = 1606;

//
// MessageId: ERROR_UNKNOWN_COMPONENT
//
// MessageText:
//
//  Component ID not registered.
//
pub const ERROR_UNKNOWN_COMPONENT: i32 = 1607;

//
// MessageId: ERROR_UNKNOWN_PROPERTY
//
// MessageText:
//
//  Unknown property.
//
pub const ERROR_UNKNOWN_PROPERTY: i32 = 1608;

//
// MessageId: ERROR_INVALID_HANDLE_STATE
//
// MessageText:
//
//  Handle is in an invalid state.
//
pub const ERROR_INVALID_HANDLE_STATE: i32 = 1609;

//
// MessageId: ERROR_BAD_CONFIGURATION
//
// MessageText:
//
//  The configuration data for this product is corrupt.  Contact your support personnel.
//
pub const ERROR_BAD_CONFIGURATION: i32 = 1610;

//
// MessageId: ERROR_INDEX_ABSENT
//
// MessageText:
//
//  Component qualifier not present.
//
pub const ERROR_INDEX_ABSENT: i32 = 1611;

//
// MessageId: ERROR_INSTALL_SOURCE_ABSENT
//
// MessageText:
//
//  The installation source for this product is not available.  Verify that the source exists and that you can access it.
//
pub const ERROR_INSTALL_SOURCE_ABSENT: i32 = 1612;

//
// MessageId: ERROR_INSTALL_PACKAGE_VERSION
//
// MessageText:
//
//  This installation package cannot be installed by the Windows Installer service.  You must install a Windows service pack that contains a newer version of the Windows Installer service.
//
pub const ERROR_INSTALL_PACKAGE_VERSION: i32 = 1613;

//
// MessageId: ERROR_PRODUCT_UNINSTALLED
//
// MessageText:
//
//  Product is uninstalled.
//
pub const ERROR_PRODUCT_UNINSTALLED: i32 = 1614;

//
// MessageId: ERROR_BAD_QUERY_SYNTAX
//
// MessageText:
//
//  SQL query syntax invalid or unsupported.
//
pub const ERROR_BAD_QUERY_SYNTAX: i32 = 1615;

//
// MessageId: ERROR_INVALID_FIELD
//
// MessageText:
//
//  Record field does not exist.
//
pub const ERROR_INVALID_FIELD: i32 = 1616;

//
// MessageId: ERROR_DEVICE_REMOVED
//
// MessageText:
//
//  The device has been removed.
//
pub const ERROR_DEVICE_REMOVED: i32 = 1617;

//
// MessageId: ERROR_INSTALL_ALREADY_RUNNING
//
// MessageText:
//
//  Another installation is already in progress.  Complete that installation before proceeding with this install.
//
pub const ERROR_INSTALL_ALREADY_RUNNING: i32 = 1618;

//
// MessageId: ERROR_INSTALL_PACKAGE_OPEN_FAILED
//
// MessageText:
//
//  This installation package could not be opened.  Verify that the package exists and that you can access it, or contact the application vendor to verify that this is a valid Windows Installer package.
//
pub const ERROR_INSTALL_PACKAGE_OPEN_FAILED: i32 = 1619;

//
// MessageId: ERROR_INSTALL_PACKAGE_INVALID
//
// MessageText:
//
//  This installation package could not be opened.  Contact the application vendor to verify that this is a valid Windows Installer package.
//
pub const ERROR_INSTALL_PACKAGE_INVALID: i32 = 1620;

//
// MessageId: ERROR_INSTALL_UI_FAILURE
//
// MessageText:
//
//  There was an error starting the Windows Installer service user interface.  Contact your support personnel.
//
pub const ERROR_INSTALL_UI_FAILURE: i32 = 1621;

//
// MessageId: ERROR_INSTALL_LOG_FAILURE
//
// MessageText:
//
//  Error opening installation log file. Verify that the specified log file location exists and that you can write to it.
//
pub const ERROR_INSTALL_LOG_FAILURE: i32 = 1622;

//
// MessageId: ERROR_INSTALL_LANGUAGE_UNSUPPORTED
//
// MessageText:
//
//  The language of this installation package is not supported by your system.
//
pub const ERROR_INSTALL_LANGUAGE_UNSUPPORTED: i32 = 1623;

//
// MessageId: ERROR_INSTALL_TRANSFORM_FAILURE
//
// MessageText:
//
//  Error applying transforms.  Verify that the specified transform paths are valid.
//
pub const ERROR_INSTALL_TRANSFORM_FAILURE: i32 = 1624;

//
// MessageId: ERROR_INSTALL_PACKAGE_REJECTED
//
// MessageText:
//
//  This installation is forbidden by system policy.  Contact your system administrator.
//
pub const ERROR_INSTALL_PACKAGE_REJECTED: i32 = 1625;

//
// MessageId: ERROR_FUNCTION_NOT_CALLED
//
// MessageText:
//
//  Function could not be executed.
//
pub const ERROR_FUNCTION_NOT_CALLED: i32 = 1626;

//
// MessageId: ERROR_FUNCTION_FAILED
//
// MessageText:
//
//  Function failed during execution.
//
pub const ERROR_FUNCTION_FAILED: i32 = 1627;

//
// MessageId: ERROR_INVALID_TABLE
//
// MessageText:
//
//  Invalid or unknown table specified.
//
pub const ERROR_INVALID_TABLE: i32 = 1628;

//
// MessageId: ERROR_DATATYPE_MISMATCH
//
// MessageText:
//
//  Data supplied is of wrong type.
//
pub const ERROR_DATATYPE_MISMATCH: i32 = 1629;

//
// MessageId: ERROR_UNSUPPORTED_TYPE
//
// MessageText:
//
//  Data of this type is not supported.
//
pub const ERROR_UNSUPPORTED_TYPE: i32 = 1630;

//
// MessageId: ERROR_CREATE_FAILED
//
// MessageText:
//
//  The Windows Installer service failed to start.  Contact your support personnel.
//
pub const ERROR_CREATE_FAILED: i32 = 1631;

//
// MessageId: ERROR_INSTALL_TEMP_UNWRITABLE
//
// MessageText:
//
//  The Temp folder is on a drive that is full or is inaccessible. Free up space on the drive or verify that you have write permission on the Temp folder.
//
pub const ERROR_INSTALL_TEMP_UNWRITABLE: i32 = 1632;

//
// MessageId: ERROR_INSTALL_PLATFORM_UNSUPPORTED
//
// MessageText:
//
//  This installation package is not supported by this processor type. Contact your product vendor.
//
pub const ERROR_INSTALL_PLATFORM_UNSUPPORTED: i32 = 1633;

//
// MessageId: ERROR_INSTALL_NOTUSED
//
// MessageText:
//
//  Component not used on this computer.
//
pub const ERROR_INSTALL_NOTUSED: i32 = 1634;

//
// MessageId: ERROR_PATCH_PACKAGE_OPEN_FAILED
//
// MessageText:
//
//  This patch package could not be opened.  Verify that the patch package exists and that you can access it, or contact the application vendor to verify that this is a valid Windows Installer patch package.
//
pub const ERROR_PATCH_PACKAGE_OPEN_FAILED: i32 = 1635;

//
// MessageId: ERROR_PATCH_PACKAGE_INVALID
//
// MessageText:
//
//  This patch package could not be opened.  Contact the application vendor to verify that this is a valid Windows Installer patch package.
//
pub const ERROR_PATCH_PACKAGE_INVALID: i32 = 1636;

//
// MessageId: ERROR_PATCH_PACKAGE_UNSUPPORTED
//
// MessageText:
//
//  This patch package cannot be processed by the Windows Installer service.  You must install a Windows service pack that contains a newer version of the Windows Installer service.
//
pub const ERROR_PATCH_PACKAGE_UNSUPPORTED: i32 = 1637;

//
// MessageId: ERROR_PRODUCT_VERSION
//
// MessageText:
//
//  Another version of this product is already installed.  Installation of this version cannot continue.  To configure or remove the existing version of this product, use Add/Remove Programs on the Control Panel.
//
pub const ERROR_PRODUCT_VERSION: i32 = 1638;

//
// MessageId: ERROR_INVALID_COMMAND_LINE
//
// MessageText:
//
//  Invalid command line argument.  Consult the Windows Installer SDK for detailed command line help.
//
pub const ERROR_INVALID_COMMAND_LINE: i32 = 1639;

//
// MessageId: ERROR_INSTALL_REMOTE_DISALLOWED
//
// MessageText:
//
//  Only administrators have permission to add, remove, or configure server software during a Terminal services remote session. If you want to install or configure software on the server, contact your network administrator.
//
pub const ERROR_INSTALL_REMOTE_DISALLOWED: i32 = 1640;

//
// MessageId: ERROR_SUCCESS_REBOOT_INITIATED
//
// MessageText:
//
//  The requested operation completed successfully.  The system will be restarted so the changes can take effect.
//
pub const ERROR_SUCCESS_REBOOT_INITIATED: i32 = 1641;

//
// MessageId: ERROR_PATCH_TARGET_NOT_FOUND
//
// MessageText:
//
//  The upgrade patch cannot be installed by the Windows Installer service because the program to be upgraded may be missing, or the upgrade patch may update a different version of the program. Verify that the program to be upgraded exists on your computer an
//  d that you have the correct upgrade patch.
//
pub const ERROR_PATCH_TARGET_NOT_FOUND: i32 = 1642;

//
// MessageId: ERROR_PATCH_PACKAGE_REJECTED
//
// MessageText:
//
//  The patch package is not permitted by software restriction policy.
//
pub const ERROR_PATCH_PACKAGE_REJECTED: i32 = 1643;

//
// MessageId: ERROR_INSTALL_TRANSFORM_REJECTED
//
// MessageText:
//
//  One or more customizations are not permitted by software restriction policy.
//
pub const ERROR_INSTALL_TRANSFORM_REJECTED: i32 = 1644;

//
// MessageId: ERROR_INSTALL_REMOTE_PROHIBITED
//
// MessageText:
//
//  The Windows Installer does not permit installation from a Remote Desktop Connection.
//
pub const ERROR_INSTALL_REMOTE_PROHIBITED: i32 = 1645;

// End of MSI error codes

///////////////////////////
//                       //
//   RPC Status Codes    //
//                       //
///////////////////////////

//
// MessageId: RPC_S_INVALID_STRING_BINDING
//
// MessageText:
//
//  The string binding is invalid.
//
pub const RPC_S_INVALID_STRING_BINDING: i32 = 1700;

//
// MessageId: RPC_S_WRONG_KIND_OF_BINDING
//
// MessageText:
//
//  The binding handle is not the correct type.
//
pub const RPC_S_WRONG_KIND_OF_BINDING: i32 = 1701;

//
// MessageId: RPC_S_INVALID_BINDING
//
// MessageText:
//
//  The binding handle is invalid.
//
pub const RPC_S_INVALID_BINDING: i32 = 1702;

//
// MessageId: RPC_S_PROTSEQ_NOT_SUPPORTED
//
// MessageText:
//
//  The RPC protocol sequence is not supported.
//
pub const RPC_S_PROTSEQ_NOT_SUPPORTED: i32 = 1703;

//
// MessageId: RPC_S_INVALID_RPC_PROTSEQ
//
// MessageText:
//
//  The RPC protocol sequence is invalid.
//
pub const RPC_S_INVALID_RPC_PROTSEQ: i32 = 1704;

//
// MessageId: RPC_S_INVALID_STRING_UUID
//
// MessageText:
//
//  The string universal unique identifier (UUID) is invalid.
//
pub const RPC_S_INVALID_STRING_UUID: i32 = 1705;

//
// MessageId: RPC_S_INVALID_ENDPOINT_FORMAT
//
// MessageText:
//
//  The endpoint format is invalid.
//
pub const RPC_S_INVALID_ENDPOINT_FORMAT: i32 = 1706;

//
// MessageId: RPC_S_INVALID_NET_ADDR
//
// MessageText:
//
//  The network address is invalid.
//
pub const RPC_S_INVALID_NET_ADDR: i32 = 1707;

//
// MessageId: RPC_S_NO_ENDPOINT_FOUND
//
// MessageText:
//
//  No endpoint was found.
//
pub const RPC_S_NO_ENDPOINT_FOUND: i32 = 1708;

//
// MessageId: RPC_S_INVALID_TIMEOUT
//
// MessageText:
//
//  The timeout value is invalid.
//
pub const RPC_S_INVALID_TIMEOUT: i32 = 1709;

//
// MessageId: RPC_S_OBJECT_NOT_FOUND
//
// MessageText:
//
//  The object universal unique identifier (UUID) was not found.
//
pub const RPC_S_OBJECT_NOT_FOUND: i32 = 1710;

//
// MessageId: RPC_S_ALREADY_REGISTERED
//
// MessageText:
//
//  The object universal unique identifier (UUID) has already been registered.
//
pub const RPC_S_ALREADY_REGISTERED: i32 = 1711;

//
// MessageId: RPC_S_TYPE_ALREADY_REGISTERED
//
// MessageText:
//
//  The type universal unique identifier (UUID) has already been registered.
//
pub const RPC_S_TYPE_ALREADY_REGISTERED: i32 = 1712;

//
// MessageId: RPC_S_ALREADY_LISTENING
//
// MessageText:
//
//  The RPC server is already listening.
//
pub const RPC_S_ALREADY_LISTENING: i32 = 1713;

//
// MessageId: RPC_S_NO_PROTSEQS_REGISTERED
//
// MessageText:
//
//  No protocol sequences have been registered.
//
pub const RPC_S_NO_PROTSEQS_REGISTERED: i32 = 1714;

//
// MessageId: RPC_S_NOT_LISTENING
//
// MessageText:
//
//  The RPC server is not listening.
//
pub const RPC_S_NOT_LISTENING: i32 = 1715;

//
// MessageId: RPC_S_UNKNOWN_MGR_TYPE
//
// MessageText:
//
//  The manager type is unknown.
//
pub const RPC_S_UNKNOWN_MGR_TYPE: i32 = 1716;

//
// MessageId: RPC_S_UNKNOWN_IF
//
// MessageText:
//
//  The interface is unknown.
//
pub const RPC_S_UNKNOWN_IF: i32 = 1717;

//
// MessageId: RPC_S_NO_BINDINGS
//
// MessageText:
//
//  There are no bindings.
//
pub const RPC_S_NO_BINDINGS: i32 = 1718;

//
// MessageId: RPC_S_NO_PROTSEQS
//
// MessageText:
//
//  There are no protocol sequences.
//
pub const RPC_S_NO_PROTSEQS: i32 = 1719;

//
// MessageId: RPC_S_CANT_CREATE_ENDPOINT
//
// MessageText:
//
//  The endpoint cannot be created.
//
pub const RPC_S_CANT_CREATE_ENDPOINT: i32 = 1720;

//
// MessageId: RPC_S_OUT_OF_RESOURCES
//
// MessageText:
//
//  Not enough resources are available to complete this operation.
//
pub const RPC_S_OUT_OF_RESOURCES: i32 = 1721;

//
// MessageId: RPC_S_SERVER_UNAVAILABLE
//
// MessageText:
//
//  The RPC server is unavailable.
//
pub const RPC_S_SERVER_UNAVAILABLE: i32 = 1722;

//
// MessageId: RPC_S_SERVER_TOO_BUSY
//
// MessageText:
//
//  The RPC server is too busy to complete this operation.
//
pub const RPC_S_SERVER_TOO_BUSY: i32 = 1723;

//
// MessageId: RPC_S_INVALID_NETWORK_OPTIONS
//
// MessageText:
//
//  The network options are invalid.
//
pub const RPC_S_INVALID_NETWORK_OPTIONS: i32 = 1724;

//
// MessageId: RPC_S_NO_CALL_ACTIVE
//
// MessageText:
//
//  There are no remote procedure calls active on this thread.
//
pub const RPC_S_NO_CALL_ACTIVE: i32 = 1725;

//
// MessageId: RPC_S_CALL_FAILED
//
// MessageText:
//
//  The remote procedure call failed.
//
pub const RPC_S_CALL_FAILED: i32 = 1726;

//
// MessageId: RPC_S_CALL_FAILED_DNE
//
// MessageText:
//
//  The remote procedure call failed and did not execute.
//
pub const RPC_S_CALL_FAILED_DNE: i32 = 1727;

//
// MessageId: RPC_S_PROTOCOL_ERROR
//
// MessageText:
//
//  A remote procedure call (RPC) protocol error occurred.
//
pub const RPC_S_PROTOCOL_ERROR: i32 = 1728;

//
// MessageId: RPC_S_UNSUPPORTED_TRANS_SYN
//
// MessageText:
//
//  The transfer syntax is not supported by the RPC server.
//
pub const RPC_S_UNSUPPORTED_TRANS_SYN: i32 = 1730;

//
// MessageId: RPC_S_UNSUPPORTED_TYPE
//
// MessageText:
//
//  The universal unique identifier (UUID) type is not supported.
//
pub const RPC_S_UNSUPPORTED_TYPE: i32 = 1732;

//
// MessageId: RPC_S_INVALID_TAG
//
// MessageText:
//
//  The tag is invalid.
//
pub const RPC_S_INVALID_TAG: i32 = 1733;

//
// MessageId: RPC_S_INVALID_BOUND
//
// MessageText:
//
//  The array bounds are invalid.
//
pub const RPC_S_INVALID_BOUND: i32 = 1734;

//
// MessageId: RPC_S_NO_ENTRY_NAME
//
// MessageText:
//
//  The binding does not contain an entry name.
//
pub const RPC_S_NO_ENTRY_NAME: i32 = 1735;

//
// MessageId: RPC_S_INVALID_NAME_SYNTAX
//
// MessageText:
//
//  The name syntax is invalid.
//
pub const RPC_S_INVALID_NAME_SYNTAX: i32 = 1736;

//
// MessageId: RPC_S_UNSUPPORTED_NAME_SYNTAX
//
// MessageText:
//
//  The name syntax is not supported.
//
pub const RPC_S_UNSUPPORTED_NAME_SYNTAX: i32 = 1737;

//
// MessageId: RPC_S_UUID_NO_ADDRESS
//
// MessageText:
//
//  No network address is available to use to export construct a universal unique identifier (UUID).
//
pub const RPC_S_UUID_NO_ADDRESS: i32 = 1739;

//
// MessageId: RPC_S_DUPLICATE_ENDPOINT
//
// MessageText:
//
//  The endpoint is a duplicate.
//
pub const RPC_S_DUPLICATE_ENDPOINT: i32 = 1740;

//
// MessageId: RPC_S_UNKNOWN_AUTHN_TYPE
//
// MessageText:
//
//  The authentication type is unknown.
//
pub const RPC_S_UNKNOWN_AUTHN_TYPE: i32 = 1741;

//
// MessageId: RPC_S_MAX_CALLS_TOO_SMALL
//
// MessageText:
//
//  The maximum number of calls is too small.
//
pub const RPC_S_MAX_CALLS_TOO_SMALL: i32 = 1742;

//
// MessageId: RPC_S_STRING_TOO_LONG
//
// MessageText:
//
//  The string is too long.
//
pub const RPC_S_STRING_TOO_LONG: i32 = 1743;

//
// MessageId: RPC_S_PROTSEQ_NOT_FOUND
//
// MessageText:
//
//  The RPC protocol sequence was not found.
//
pub const RPC_S_PROTSEQ_NOT_FOUND: i32 = 1744;

//
// MessageId: RPC_S_PROCNUM_OUT_OF_RANGE
//
// MessageText:
//
//  The procedure number is out of range.
//
pub const RPC_S_PROCNUM_OUT_OF_RANGE: i32 = 1745;

//
// MessageId: RPC_S_BINDING_HAS_NO_AUTH
//
// MessageText:
//
//  The binding does not contain any authentication information.
//
pub const RPC_S_BINDING_HAS_NO_AUTH: i32 = 1746;

//
// MessageId: RPC_S_UNKNOWN_AUTHN_SERVICE
//
// MessageText:
//
//  The authentication service is unknown.
//
pub const RPC_S_UNKNOWN_AUTHN_SERVICE: i32 = 1747;

//
// MessageId: RPC_S_UNKNOWN_AUTHN_LEVEL
//
// MessageText:
//
//  The authentication level is unknown.
//
pub const RPC_S_UNKNOWN_AUTHN_LEVEL: i32 = 1748;

//
// MessageId: RPC_S_INVALID_AUTH_IDENTITY
//
// MessageText:
//
//  The security context is invalid.
//
pub const RPC_S_INVALID_AUTH_IDENTITY: i32 = 1749;

//
// MessageId: RPC_S_UNKNOWN_AUTHZ_SERVICE
//
// MessageText:
//
//  The authorization service is unknown.
//
pub const RPC_S_UNKNOWN_AUTHZ_SERVICE: i32 = 1750;

//
// MessageId: EPT_S_INVALID_ENTRY
//
// MessageText:
//
//  The entry is invalid.
//
pub const EPT_S_INVALID_ENTRY: i32 = 1751;

//
// MessageId: EPT_S_CANT_PERFORM_OP
//
// MessageText:
//
//  The server endpoint cannot perform the operation.
//
pub const EPT_S_CANT_PERFORM_OP: i32 = 1752;

//
// MessageId: EPT_S_NOT_REGISTERED
//
// MessageText:
//
//  There are no more endpoints available from the endpoint mapper.
//
pub const EPT_S_NOT_REGISTERED: i32 = 1753;

//
// MessageId: RPC_S_NOTHING_TO_EXPORT
//
// MessageText:
//
//  No interfaces have been exported.
//
pub const RPC_S_NOTHING_TO_EXPORT: i32 = 1754;

//
// MessageId: RPC_S_INCOMPLETE_NAME
//
// MessageText:
//
//  The entry name is incomplete.
//
pub const RPC_S_INCOMPLETE_NAME: i32 = 1755;

//
// MessageId: RPC_S_INVALID_VERS_OPTION
//
// MessageText:
//
//  The version option is invalid.
//
pub const RPC_S_INVALID_VERS_OPTION: i32 = 1756;

//
// MessageId: RPC_S_NO_MORE_MEMBERS
//
// MessageText:
//
//  There are no more members.
//
pub const RPC_S_NO_MORE_MEMBERS: i32 = 1757;

//
// MessageId: RPC_S_NOT_ALL_OBJS_UNEXPORTED
//
// MessageText:
//
//  There is nothing to unexport.
//
pub const RPC_S_NOT_ALL_OBJS_UNEXPORTED: i32 = 1758;

//
// MessageId: RPC_S_INTERFACE_NOT_FOUND
//
// MessageText:
//
//  The interface was not found.
//
pub const RPC_S_INTERFACE_NOT_FOUND: i32 = 1759;

//
// MessageId: RPC_S_ENTRY_ALREADY_EXISTS
//
// MessageText:
//
//  The entry already exists.
//
pub const RPC_S_ENTRY_ALREADY_EXISTS: i32 = 1760;

//
// MessageId: RPC_S_ENTRY_NOT_FOUND
//
// MessageText:
//
//  The entry is not found.
//
pub const RPC_S_ENTRY_NOT_FOUND: i32 = 1761;

//
// MessageId: RPC_S_NAME_SERVICE_UNAVAILABLE
//
// MessageText:
//
//  The name service is unavailable.
//
pub const RPC_S_NAME_SERVICE_UNAVAILABLE: i32 = 1762;

//
// MessageId: RPC_S_INVALID_NAF_ID
//
// MessageText:
//
//  The network address family is invalid.
//
pub const RPC_S_INVALID_NAF_ID: i32 = 1763;

//
// MessageId: RPC_S_CANNOT_SUPPORT
//
// MessageText:
//
//  The requested operation is not supported.
//
pub const RPC_S_CANNOT_SUPPORT: i32 = 1764;

//
// MessageId: RPC_S_NO_CONTEXT_AVAILABLE
//
// MessageText:
//
//  No security context is available to allow impersonation.
//
pub const RPC_S_NO_CONTEXT_AVAILABLE: i32 = 1765;

//
// MessageId: RPC_S_INTERNAL_ERROR
//
// MessageText:
//
//  An internal error occurred in a remote procedure call (RPC).
//
pub const RPC_S_INTERNAL_ERROR: i32 = 1766;

//
// MessageId: RPC_S_ZERO_DIVIDE
//
// MessageText:
//
//  The RPC server attempted an integer division by zero.
//
pub const RPC_S_ZERO_DIVIDE: i32 = 1767;

//
// MessageId: RPC_S_ADDRESS_ERROR
//
// MessageText:
//
//  An addressing error occurred in the RPC server.
//
pub const RPC_S_ADDRESS_ERROR: i32 = 1768;

//
// MessageId: RPC_S_FP_DIV_ZERO
//
// MessageText:
//
//  A floating-point operation at the RPC server caused a division by zero.
//
pub const RPC_S_FP_DIV_ZERO: i32 = 1769;

//
// MessageId: RPC_S_FP_UNDERFLOW
//
// MessageText:
//
//  A floating-point underflow occurred at the RPC server.
//
pub const RPC_S_FP_UNDERFLOW: i32 = 1770;

//
// MessageId: RPC_S_FP_OVERFLOW
//
// MessageText:
//
//  A floating-point overflow occurred at the RPC server.
//
pub const RPC_S_FP_OVERFLOW: i32 = 1771;

//
// MessageId: RPC_X_NO_MORE_ENTRIES
//
// MessageText:
//
//  The list of RPC servers available for the binding of auto handles has been exhausted.
//
pub const RPC_X_NO_MORE_ENTRIES: i32 = 1772;

//
// MessageId: RPC_X_SS_CHAR_TRANS_OPEN_FAIL
//
// MessageText:
//
//  Unable to open the character translation table file.
//
pub const RPC_X_SS_CHAR_TRANS_OPEN_FAIL: i32 = 1773;

//
// MessageId: RPC_X_SS_CHAR_TRANS_SHORT_FILE
//
// MessageText:
//
//  The file containing the character translation table has fewer than 512 bytes.
//
pub const RPC_X_SS_CHAR_TRANS_SHORT_FILE: i32 = 1774;

//
// MessageId: RPC_X_SS_IN_NULL_CONTEXT
//
// MessageText:
//
//  A null context handle was passed from the client to the host during a remote procedure call.
//
pub const RPC_X_SS_IN_NULL_CONTEXT: i32 = 1775;

//
// MessageId: RPC_X_SS_CONTEXT_DAMAGED
//
// MessageText:
//
//  The context handle changed during a remote procedure call.
//
pub const RPC_X_SS_CONTEXT_DAMAGED: i32 = 1777;

//
// MessageId: RPC_X_SS_HANDLES_MISMATCH
//
// MessageText:
//
//  The binding handles passed to a remote procedure call do not match.
//
pub const RPC_X_SS_HANDLES_MISMATCH: i32 = 1778;

//
// MessageId: RPC_X_SS_CANNOT_GET_CALL_HANDLE
//
// MessageText:
//
//  The stub is unable to get the remote procedure call handle.
//
pub const RPC_X_SS_CANNOT_GET_CALL_HANDLE: i32 = 1779;

//
// MessageId: RPC_X_NULL_REF_POINTER
//
// MessageText:
//
//  A null reference pointer was passed to the stub.
//
pub const RPC_X_NULL_REF_POINTER: i32 = 1780;

//
// MessageId: RPC_X_ENUM_VALUE_OUT_OF_RANGE
//
// MessageText:
//
//  The enumeration value is out of range.
//
pub const RPC_X_ENUM_VALUE_OUT_OF_RANGE: i32 = 1781;

//
// MessageId: RPC_X_BYTE_COUNT_TOO_SMALL
//
// MessageText:
//
//  The byte count is too small.
//
pub const RPC_X_BYTE_COUNT_TOO_SMALL: i32 = 1782;

//
// MessageId: RPC_X_BAD_STUB_DATA
//
// MessageText:
//
//  The stub received bad data.
//
pub const RPC_X_BAD_STUB_DATA: i32 = 1783;

//
// MessageId: ERROR_INVALID_USER_BUFFER
//
// MessageText:
//
//  The supplied user buffer is not valid for the requested operation.
//
pub const ERROR_INVALID_USER_BUFFER: i32 = 1784;

//
// MessageId: ERROR_UNRECOGNIZED_MEDIA
//
// MessageText:
//
//  The disk media is not recognized. It may not be formatted.
//
pub const ERROR_UNRECOGNIZED_MEDIA: i32 = 1785;

//
// MessageId: ERROR_NO_TRUST_LSA_SECRET
//
// MessageText:
//
//  The workstation does not have a trust secret.
//
pub const ERROR_NO_TRUST_LSA_SECRET: i32 = 1786;

//
// MessageId: ERROR_NO_TRUST_SAM_ACCOUNT
//
// MessageText:
//
//  The security database on the server does not have a computer account for this workstation trust relationship.
//
pub const ERROR_NO_TRUST_SAM_ACCOUNT: i32 = 1787;

//
// MessageId: ERROR_TRUSTED_DOMAIN_FAILURE
//
// MessageText:
//
//  The trust relationship between the primary domain and the trusted domain failed.
//
pub const ERROR_TRUSTED_DOMAIN_FAILURE: i32 = 1788;

//
// MessageId: ERROR_TRUSTED_RELATIONSHIP_FAILURE
//
// MessageText:
//
//  The trust relationship between this workstation and the primary domain failed.
//
pub const ERROR_TRUSTED_RELATIONSHIP_FAILURE: i32 = 1789;

//
// MessageId: ERROR_TRUST_FAILURE
//
// MessageText:
//
//  The network logon failed.
//
pub const ERROR_TRUST_FAILURE: i32 = 1790;

//
// MessageId: RPC_S_CALL_IN_PROGRESS
//
// MessageText:
//
//  A remote procedure call is already in progress for this thread.
//
pub const RPC_S_CALL_IN_PROGRESS: i32 = 1791;

//
// MessageId: ERROR_NETLOGON_NOT_STARTED
//
// MessageText:
//
//  An attempt was made to logon, but the network logon service was not started.
//
pub const ERROR_NETLOGON_NOT_STARTED: i32 = 1792;

//
// MessageId: ERROR_ACCOUNT_EXPIRED
//
// MessageText:
//
//  The user's account has expired.
//
pub const ERROR_ACCOUNT_EXPIRED: i32 = 1793;

//
// MessageId: ERROR_REDIRECTOR_HAS_OPEN_HANDLES
//
// MessageText:
//
//  The redirector is in use and cannot be unloaded.
//
pub const ERROR_REDIRECTOR_HAS_OPEN_HANDLES: i32 = 1794;

//
// MessageId: ERROR_PRINTER_DRIVER_ALREADY_INSTALLED
//
// MessageText:
//
//  The specified printer driver is already installed.
//
pub const ERROR_PRINTER_DRIVER_ALREADY_INSTALLED: i32 = 1795;

//
// MessageId: ERROR_UNKNOWN_PORT
//
// MessageText:
//
//  The specified port is unknown.
//
pub const ERROR_UNKNOWN_PORT: i32 = 1796;

//
// MessageId: ERROR_UNKNOWN_PRINTER_DRIVER
//
// MessageText:
//
//  The printer driver is unknown.
//
pub const ERROR_UNKNOWN_PRINTER_DRIVER: i32 = 1797;

//
// MessageId: ERROR_UNKNOWN_PRINTPROCESSOR
//
// MessageText:
//
//  The print processor is unknown.
//
pub const ERROR_UNKNOWN_PRINTPROCESSOR: i32 = 1798;

//
// MessageId: ERROR_INVALID_SEPARATOR_FILE
//
// MessageText:
//
//  The specified separator file is invalid.
//
pub const ERROR_INVALID_SEPARATOR_FILE: i32 = 1799;

//
// MessageId: ERROR_INVALID_PRIORITY
//
// MessageText:
//
//  The specified priority is invalid.
//
pub const ERROR_INVALID_PRIORITY: i32 = 1800;

//
// MessageId: ERROR_INVALID_PRINTER_NAME
//
// MessageText:
//
//  The printer name is invalid.
//
pub const ERROR_INVALID_PRINTER_NAME: i32 = 1801;

//
// MessageId: ERROR_PRINTER_ALREADY_EXISTS
//
// MessageText:
//
//  The printer already exists.
//
pub const ERROR_PRINTER_ALREADY_EXISTS: i32 = 1802;

//
// MessageId: ERROR_INVALID_PRINTER_COMMAND
//
// MessageText:
//
//  The printer command is invalid.
//
pub const ERROR_INVALID_PRINTER_COMMAND: i32 = 1803;

//
// MessageId: ERROR_INVALID_DATATYPE
//
// MessageText:
//
//  The specified datatype is invalid.
//
pub const ERROR_INVALID_DATATYPE: i32 = 1804;

//
// MessageId: ERROR_INVALID_ENVIRONMENT
//
// MessageText:
//
//  The environment specified is invalid.
//
pub const ERROR_INVALID_ENVIRONMENT: i32 = 1805;

//
// MessageId: RPC_S_NO_MORE_BINDINGS
//
// MessageText:
//
//  There are no more bindings.
//
pub const RPC_S_NO_MORE_BINDINGS: i32 = 1806;

//
// MessageId: ERROR_NOLOGON_INTERDOMAIN_TRUST_ACCOUNT
//
// MessageText:
//
//  The account used is an interdomain trust account. Use your global user account or local user account to access this server.
//
pub const ERROR_NOLOGON_INTERDOMAIN_TRUST_ACCOUNT: i32 = 1807;

//
// MessageId: ERROR_NOLOGON_WORKSTATION_TRUST_ACCOUNT
//
// MessageText:
//
//  The account used is a computer account. Use your global user account or local user account to access this server.
//
pub const ERROR_NOLOGON_WORKSTATION_TRUST_ACCOUNT: i32 = 1808;

//
// MessageId: ERROR_NOLOGON_SERVER_TRUST_ACCOUNT
//
// MessageText:
//
//  The account used is a server trust account. Use your global user account or local user account to access this server.
//
pub const ERROR_NOLOGON_SERVER_TRUST_ACCOUNT: i32 = 1809;

//
// MessageId: ERROR_DOMAIN_TRUST_INCONSISTENT
//
// MessageText:
//
//  The name or security ID (SID) of the domain specified is inconsistent with the trust information for that domain.
//
pub const ERROR_DOMAIN_TRUST_INCONSISTENT: i32 = 1810;

//
// MessageId: ERROR_SERVER_HAS_OPEN_HANDLES
//
// MessageText:
//
//  The server is in use and cannot be unloaded.
//
pub const ERROR_SERVER_HAS_OPEN_HANDLES: i32 = 1811;

//
// MessageId: ERROR_RESOURCE_DATA_NOT_FOUND
//
// MessageText:
//
//  The specified image file did not contain a resource section.
//
pub const ERROR_RESOURCE_DATA_NOT_FOUND: i32 = 1812;

//
// MessageId: ERROR_RESOURCE_TYPE_NOT_FOUND
//
// MessageText:
//
//  The specified resource type cannot be found in the image file.
//
pub const ERROR_RESOURCE_TYPE_NOT_FOUND: i32 = 1813;

//
// MessageId: ERROR_RESOURCE_NAME_NOT_FOUND
//
// MessageText:
//
//  The specified resource name cannot be found in the image file.
//
pub const ERROR_RESOURCE_NAME_NOT_FOUND: i32 = 1814;

//
// MessageId: ERROR_RESOURCE_LANG_NOT_FOUND
//
// MessageText:
//
//  The specified resource language ID cannot be found in the image file.
//
pub const ERROR_RESOURCE_LANG_NOT_FOUND: i32 = 1815;

//
// MessageId: ERROR_NOT_ENOUGH_QUOTA
//
// MessageText:
//
//  Not enough quota is available to process this command.
//
pub const ERROR_NOT_ENOUGH_QUOTA: i32 = 1816;

//
// MessageId: RPC_S_NO_INTERFACES
//
// MessageText:
//
//  No interfaces have been registered.
//
pub const RPC_S_NO_INTERFACES: i32 = 1817;

//
// MessageId: RPC_S_CALL_CANCELLED
//
// MessageText:
//
//  The remote procedure call was cancelled.
//
pub const RPC_S_CALL_CANCELLED: i32 = 1818;

//
// MessageId: RPC_S_BINDING_INCOMPLETE
//
// MessageText:
//
//  The binding handle does not contain all required information.
//
pub const RPC_S_BINDING_INCOMPLETE: i32 = 1819;

//
// MessageId: RPC_S_COMM_FAILURE
//
// MessageText:
//
//  A communications failure occurred during a remote procedure call.
//
pub const RPC_S_COMM_FAILURE: i32 = 1820;

//
// MessageId: RPC_S_UNSUPPORTED_AUTHN_LEVEL
//
// MessageText:
//
//  The requested authentication level is not supported.
//
pub const RPC_S_UNSUPPORTED_AUTHN_LEVEL: i32 = 1821;

//
// MessageId: RPC_S_NO_PRINC_NAME
//
// MessageText:
//
//  No principal name registered.
//
pub const RPC_S_NO_PRINC_NAME: i32 = 1822;

//
// MessageId: RPC_S_NOT_RPC_ERROR
//
// MessageText:
//
//  The error specified is not a valid Windows RPC error code.
//
pub const RPC_S_NOT_RPC_ERROR: i32 = 1823;

//
// MessageId: RPC_S_UUID_LOCAL_ONLY
//
// MessageText:
//
//  A UUID that is valid only on this computer has been allocated.
//
pub const RPC_S_UUID_LOCAL_ONLY: i32 = 1824;

//
// MessageId: RPC_S_SEC_PKG_ERROR
//
// MessageText:
//
//  A security package specific error occurred.
//
pub const RPC_S_SEC_PKG_ERROR: i32 = 1825;

//
// MessageId: RPC_S_NOT_CANCELLED
//
// MessageText:
//
//  Thread is not canceled.
//
pub const RPC_S_NOT_CANCELLED: i32 = 1826;

//
// MessageId: RPC_X_INVALID_ES_ACTION
//
// MessageText:
//
//  Invalid operation on the encoding/decoding handle.
//
pub const RPC_X_INVALID_ES_ACTION: i32 = 1827;

//
// MessageId: RPC_X_WRONG_ES_VERSION
//
// MessageText:
//
//  Incompatible version of the serializing package.
//
pub const RPC_X_WRONG_ES_VERSION: i32 = 1828;

//
// MessageId: RPC_X_WRONG_STUB_VERSION
//
// MessageText:
//
//  Incompatible version of the RPC stub.
//
pub const RPC_X_WRONG_STUB_VERSION: i32 = 1829;

//
// MessageId: RPC_X_INVALID_PIPE_OBJECT
//
// MessageText:
//
//  The RPC pipe object is invalid or corrupted.
//
pub const RPC_X_INVALID_PIPE_OBJECT: i32 = 1830;

//
// MessageId: RPC_X_WRONG_PIPE_ORDER
//
// MessageText:
//
//  An invalid operation was attempted on an RPC pipe object.
//
pub const RPC_X_WRONG_PIPE_ORDER: i32 = 1831;

//
// MessageId: RPC_X_WRONG_PIPE_VERSION
//
// MessageText:
//
//  Unsupported RPC pipe version.
//
pub const RPC_X_WRONG_PIPE_VERSION: i32 = 1832;

//
// MessageId: RPC_S_GROUP_MEMBER_NOT_FOUND
//
// MessageText:
//
//  The group member was not found.
//
pub const RPC_S_GROUP_MEMBER_NOT_FOUND: i32 = 1898;

//
// MessageId: EPT_S_CANT_CREATE
//
// MessageText:
//
//  The endpoint mapper database entry could not be created.
//
pub const EPT_S_CANT_CREATE: i32 = 1899;

//
// MessageId: RPC_S_INVALID_OBJECT
//
// MessageText:
//
//  The object universal unique identifier (UUID) is the nil UUID.
//
pub const RPC_S_INVALID_OBJECT: i32 = 1900;

//
// MessageId: ERROR_INVALID_TIME
//
// MessageText:
//
//  The specified time is invalid.
//
pub const ERROR_INVALID_TIME: i32 = 1901;

//
// MessageId: ERROR_INVALID_FORM_NAME
//
// MessageText:
//
//  The specified form name is invalid.
//
pub const ERROR_INVALID_FORM_NAME: i32 = 1902;

//
// MessageId: ERROR_INVALID_FORM_SIZE
//
// MessageText:
//
//  The specified form size is invalid.
//
pub const ERROR_INVALID_FORM_SIZE: i32 = 1903;

//
// MessageId: ERROR_ALREADY_WAITING
//
// MessageText:
//
//  The specified printer handle is already being waited on
//
pub const ERROR_ALREADY_WAITING: i32 = 1904;

//
// MessageId: ERROR_PRINTER_DELETED
//
// MessageText:
//
//  The specified printer has been deleted.
//
pub const ERROR_PRINTER_DELETED: i32 = 1905;

//
// MessageId: ERROR_INVALID_PRINTER_STATE
//
// MessageText:
//
//  The state of the printer is invalid.
//
pub const ERROR_INVALID_PRINTER_STATE: i32 = 1906;

//
// MessageId: ERROR_PASSWORD_MUST_CHANGE
//
// MessageText:
//
//  The user's password must be changed before logging on the first time.
//
pub const ERROR_PASSWORD_MUST_CHANGE: i32 = 1907;

//
// MessageId: ERROR_DOMAIN_CONTROLLER_NOT_FOUND
//
// MessageText:
//
//  Could not find the domain controller for this domain.
//
pub const ERROR_DOMAIN_CONTROLLER_NOT_FOUND: i32 = 1908;

//
// MessageId: ERROR_ACCOUNT_LOCKED_OUT
//
// MessageText:
//
//  The referenced account is currently locked out and may not be logged on to.
//
pub const ERROR_ACCOUNT_LOCKED_OUT: i32 = 1909;

//
// MessageId: OR_INVALID_OXID
//
// MessageText:
//
//  The object exporter specified was not found.
//
pub const OR_INVALID_OXID: i32 = 1910;

//
// MessageId: OR_INVALID_OID
//
// MessageText:
//
//  The object specified was not found.
//
pub const OR_INVALID_OID: i32 = 1911;

//
// MessageId: OR_INVALID_SET
//
// MessageText:
//
//  The object resolver set specified was not found.
//
pub const OR_INVALID_SET: i32 = 1912;

//
// MessageId: RPC_S_SEND_INCOMPLETE
//
// MessageText:
//
//  Some data remains to be sent in the request buffer.
//
pub const RPC_S_SEND_INCOMPLETE: i32 = 1913;

//
// MessageId: RPC_S_INVALID_ASYNC_HANDLE
//
// MessageText:
//
//  Invalid asynchronous remote procedure call handle.
//
pub const RPC_S_INVALID_ASYNC_HANDLE: i32 = 1914;

//
// MessageId: RPC_S_INVALID_ASYNC_CALL
//
// MessageText:
//
//  Invalid asynchronous RPC call handle for this operation.
//
pub const RPC_S_INVALID_ASYNC_CALL: i32 = 1915;

//
// MessageId: RPC_X_PIPE_CLOSED
//
// MessageText:
//
//  The RPC pipe object has already been closed.
//
pub const RPC_X_PIPE_CLOSED: i32 = 1916;

//
// MessageId: RPC_X_PIPE_DISCIPLINE_ERROR
//
// MessageText:
//
//  The RPC call completed before all pipes were processed.
//
pub const RPC_X_PIPE_DISCIPLINE_ERROR: i32 = 1917;

//
// MessageId: RPC_X_PIPE_EMPTY
//
// MessageText:
//
//  No more data is available from the RPC pipe.
//
pub const RPC_X_PIPE_EMPTY: i32 = 1918;

//
// MessageId: ERROR_NO_SITENAME
//
// MessageText:
//
//  No site name is available for this machine.
//
pub const ERROR_NO_SITENAME: i32 = 1919;

//
// MessageId: ERROR_CANT_ACCESS_FILE
//
// MessageText:
//
//  The file can not be accessed by the system.
//
pub const ERROR_CANT_ACCESS_FILE: i32 = 1920;

//
// MessageId: ERROR_CANT_RESOLVE_FILENAME
//
// MessageText:
//
//  The name of the file cannot be resolved by the system.
//
pub const ERROR_CANT_RESOLVE_FILENAME: i32 = 1921;

//
// MessageId: RPC_S_ENTRY_TYPE_MISMATCH
//
// MessageText:
//
//  The entry is not of the expected type.
//
pub const RPC_S_ENTRY_TYPE_MISMATCH: i32 = 1922;

//
// MessageId: RPC_S_NOT_ALL_OBJS_EXPORTED
//
// MessageText:
//
//  Not all object UUIDs could be exported to the specified entry.
//
pub const RPC_S_NOT_ALL_OBJS_EXPORTED: i32 = 1923;

//
// MessageId: RPC_S_INTERFACE_NOT_EXPORTED
//
// MessageText:
//
//  Interface could not be exported to the specified entry.
//
pub const RPC_S_INTERFACE_NOT_EXPORTED: i32 = 1924;

//
// MessageId: RPC_S_PROFILE_NOT_ADDED
//
// MessageText:
//
//  The specified profile entry could not be added.
//
pub const RPC_S_PROFILE_NOT_ADDED: i32 = 1925;

//
// MessageId: RPC_S_PRF_ELT_NOT_ADDED
//
// MessageText:
//
//  The specified profile element could not be added.
//
pub const RPC_S_PRF_ELT_NOT_ADDED: i32 = 1926;

//
// MessageId: RPC_S_PRF_ELT_NOT_REMOVED
//
// MessageText:
//
//  The specified profile element could not be removed.
//
pub const RPC_S_PRF_ELT_NOT_REMOVED: i32 = 1927;

//
// MessageId: RPC_S_GRP_ELT_NOT_ADDED
//
// MessageText:
//
//  The group element could not be added.
//
pub const RPC_S_GRP_ELT_NOT_ADDED: i32 = 1928;

//
// MessageId: RPC_S_GRP_ELT_NOT_REMOVED
//
// MessageText:
//
//  The group element could not be removed.
//
pub const RPC_S_GRP_ELT_NOT_REMOVED: i32 = 1929;

//
// MessageId: ERROR_KM_DRIVER_BLOCKED
//
// MessageText:
//
//  The printer driver is not compatible with a policy enabled on your computer that blocks NT 4.0 drivers.
//
pub const ERROR_KM_DRIVER_BLOCKED: i32 = 1930;

//
// MessageId: ERROR_CONTEXT_EXPIRED
//
// MessageText:
//
//  The context has expired and can no longer be used.
//
pub const ERROR_CONTEXT_EXPIRED: i32 = 1931;

//
// MessageId: ERROR_PER_USER_TRUST_QUOTA_EXCEEDED
//
// MessageText:
//
//  The current user's delegated trust creation quota has been exceeded.
//
pub const ERROR_PER_USER_TRUST_QUOTA_EXCEEDED: i32 = 1932;

//
// MessageId: ERROR_ALL_USER_TRUST_QUOTA_EXCEEDED
//
// MessageText:
//
//  The total delegated trust creation quota has been exceeded.
//
pub const ERROR_ALL_USER_TRUST_QUOTA_EXCEEDED: i32 = 1933;

//
// MessageId: ERROR_USER_DELETE_TRUST_QUOTA_EXCEEDED
//
// MessageText:
//
//  The current user's delegated trust deletion quota has been exceeded.
//
pub const ERROR_USER_DELETE_TRUST_QUOTA_EXCEEDED: i32 = 1934;

//
// MessageId: ERROR_AUTHENTICATION_FIREWALL_FAILED
//
// MessageText:
//
//  Logon Failure: The machine you are logging onto is protected by an authentication firewall.  The specified account is not allowed to authenticate to the machine.
//
pub const ERROR_AUTHENTICATION_FIREWALL_FAILED: i32 = 1935;

//
// MessageId: ERROR_REMOTE_PRINT_CONNECTIONS_BLOCKED
//
// MessageText:
//
//  Remote connections to the Print Spooler are blocked by a policy set on your machine.
//
pub const ERROR_REMOTE_PRINT_CONNECTIONS_BLOCKED: i32 = 1936;

///////////////////////////
//                       //
//   OpenGL Error Code   //
//                       //
///////////////////////////

//
// MessageId: ERROR_INVALID_PIXEL_FORMAT
//
// MessageText:
//
//  The pixel format is invalid.
//
pub const ERROR_INVALID_PIXEL_FORMAT: i32 = 2000;

//
// MessageId: ERROR_BAD_DRIVER
//
// MessageText:
//
//  The specified driver is invalid.
//
pub const ERROR_BAD_DRIVER: i32 = 2001;

//
// MessageId: ERROR_INVALID_WINDOW_STYLE
//
// MessageText:
//
//  The window style or class attribute is invalid for this operation.
//
pub const ERROR_INVALID_WINDOW_STYLE: i32 = 2002;

//
// MessageId: ERROR_METAFILE_NOT_SUPPORTED
//
// MessageText:
//
//  The requested metafile operation is not supported.
//
pub const ERROR_METAFILE_NOT_SUPPORTED: i32 = 2003;

//
// MessageId: ERROR_TRANSFORM_NOT_SUPPORTED
//
// MessageText:
//
//  The requested transformation operation is not supported.
//
pub const ERROR_TRANSFORM_NOT_SUPPORTED: i32 = 2004;

//
// MessageId: ERROR_CLIPPING_NOT_SUPPORTED
//
// MessageText:
//
//  The requested clipping operation is not supported.
//
pub const ERROR_CLIPPING_NOT_SUPPORTED: i32 = 2005;

// End of OpenGL error codes

///////////////////////////////////////////
//                                       //
//   Image Color Management Error Code   //
//                                       //
///////////////////////////////////////////

//
// MessageId: ERROR_INVALID_CMM
//
// MessageText:
//
//  The specified color management module is invalid.
//
pub const ERROR_INVALID_CMM: i32 = 2010;

//
// MessageId: ERROR_INVALID_PROFILE
//
// MessageText:
//
//  The specified color profile is invalid.
//
pub const ERROR_INVALID_PROFILE: i32 = 2011;

//
// MessageId: ERROR_TAG_NOT_FOUND
//
// MessageText:
//
//  The specified tag was not found.
//
pub const ERROR_TAG_NOT_FOUND: i32 = 2012;

//
// MessageId: ERROR_TAG_NOT_PRESENT
//
// MessageText:
//
//  A required tag is not present.
//
pub const ERROR_TAG_NOT_PRESENT: i32 = 2013;

//
// MessageId: ERROR_DUPLICATE_TAG
//
// MessageText:
//
//  The specified tag is already present.
//
pub const ERROR_DUPLICATE_TAG: i32 = 2014;

//
// MessageId: ERROR_PROFILE_NOT_ASSOCIATED_WITH_DEVICE
//
// MessageText:
//
//  The specified color profile is not associated with any device.
//
pub const ERROR_PROFILE_NOT_ASSOCIATED_WITH_DEVICE: i32 = 2015;

//
// MessageId: ERROR_PROFILE_NOT_FOUND
//
// MessageText:
//
//  The specified color profile was not found.
//
pub const ERROR_PROFILE_NOT_FOUND: i32 = 2016;

//
// MessageId: ERROR_INVALID_COLORSPACE
//
// MessageText:
//
//  The specified color space is invalid.
//
pub const ERROR_INVALID_COLORSPACE: i32 = 2017;

//
// MessageId: ERROR_ICM_NOT_ENABLED
//
// MessageText:
//
//  Image Color Management is not enabled.
//
pub const ERROR_ICM_NOT_ENABLED: i32 = 2018;

//
// MessageId: ERROR_DELETING_ICM_XFORM
//
// MessageText:
//
//  There was an error while deleting the color transform.
//
pub const ERROR_DELETING_ICM_XFORM: i32 = 2019;

//
// MessageId: ERROR_INVALID_TRANSFORM
//
// MessageText:
//
//  The specified color transform is invalid.
//
pub const ERROR_INVALID_TRANSFORM: i32 = 2020;

//
// MessageId: ERROR_COLORSPACE_MISMATCH
//
// MessageText:
//
//  The specified transform does not match the bitmap's color space.
//
pub const ERROR_COLORSPACE_MISMATCH: i32 = 2021;

//
// MessageId: ERROR_INVALID_COLORINDEX
//
// MessageText:
//
//  The specified named color index is not present in the profile.
//
pub const ERROR_INVALID_COLORINDEX: i32 = 2022;

///////////////////////////
//                       //
// Winnet32 Status Codes //
//                       //
// The range 2100 through 2999 is reserved for network status codes.
// See lmerr.h for a complete listing
///////////////////////////

//
// MessageId: ERROR_CONNECTED_OTHER_PASSWORD
//
// MessageText:
//
//  The network connection was made successfully, but the user had to be prompted for a password other than the one originally specified.
//
pub const ERROR_CONNECTED_OTHER_PASSWORD: i32 = 2108;

//
// MessageId: ERROR_CONNECTED_OTHER_PASSWORD_DEFAULT
//
// MessageText:
//
//  The network connection was made successfully using default credentials.
//
pub const ERROR_CONNECTED_OTHER_PASSWORD_DEFAULT: i32 = 2109;

//
// MessageId: ERROR_BAD_USERNAME
//
// MessageText:
//
//  The specified username is invalid.
//
pub const ERROR_BAD_USERNAME: i32 = 2202;

//
// MessageId: ERROR_NOT_CONNECTED
//
// MessageText:
//
//  This network connection does not exist.
//
pub const ERROR_NOT_CONNECTED: i32 = 2250;

//
// MessageId: ERROR_OPEN_FILES
//
// MessageText:
//
//  This network connection has files open or requests pending.
//
pub const ERROR_OPEN_FILES: i32 = 2401;

//
// MessageId: ERROR_ACTIVE_CONNECTIONS
//
// MessageText:
//
//  Active connections still exist.
//
pub const ERROR_ACTIVE_CONNECTIONS: i32 = 2402;

//
// MessageId: ERROR_DEVICE_IN_USE
//
// MessageText:
//
//  The device is in use by an active process and cannot be disconnected.
//
pub const ERROR_DEVICE_IN_USE: i32 = 2404;

////////////////////////////////////
//                                //
//     Win32 Spooler Error Codes  //
//                                //
////////////////////////////////////
//
// MessageId: ERROR_UNKNOWN_PRINT_MONITOR
//
// MessageText:
//
//  The specified print monitor is unknown.
//
pub const ERROR_UNKNOWN_PRINT_MONITOR: i32 = 3000;

//
// MessageId: ERROR_PRINTER_DRIVER_IN_USE
//
// MessageText:
//
//  The specified printer driver is currently in use.
//
pub const ERROR_PRINTER_DRIVER_IN_USE: i32 = 3001;

//
// MessageId: ERROR_SPOOL_FILE_NOT_FOUND
//
// MessageText:
//
//  The spool file was not found.
//
pub const ERROR_SPOOL_FILE_NOT_FOUND: i32 = 3002;

//
// MessageId: ERROR_SPL_NO_STARTDOC
//
// MessageText:
//
//  A StartDocPrinter call was not issued.
//
pub const ERROR_SPL_NO_STARTDOC: i32 = 3003;

//
// MessageId: ERROR_SPL_NO_ADDJOB
//
// MessageText:
//
//  An AddJob call was not issued.
//
pub const ERROR_SPL_NO_ADDJOB: i32 = 3004;

//
// MessageId: ERROR_PRINT_PROCESSOR_ALREADY_INSTALLED
//
// MessageText:
//
//  The specified print processor has already been installed.
//
pub const ERROR_PRINT_PROCESSOR_ALREADY_INSTALLED: i32 = 3005;

//
// MessageId: ERROR_PRINT_MONITOR_ALREADY_INSTALLED
//
// MessageText:
//
//  The specified print monitor has already been installed.
//
pub const ERROR_PRINT_MONITOR_ALREADY_INSTALLED: i32 = 3006;

//
// MessageId: ERROR_INVALID_PRINT_MONITOR
//
// MessageText:
//
//  The specified print monitor does not have the required functions.
//
pub const ERROR_INVALID_PRINT_MONITOR: i32 = 3007;

//
// MessageId: ERROR_PRINT_MONITOR_IN_USE
//
// MessageText:
//
//  The specified print monitor is currently in use.
//
pub const ERROR_PRINT_MONITOR_IN_USE: i32 = 3008;

//
// MessageId: ERROR_PRINTER_HAS_JOBS_QUEUED
//
// MessageText:
//
//  The requested operation is not allowed when there are jobs queued to the printer.
//
pub const ERROR_PRINTER_HAS_JOBS_QUEUED: i32 = 3009;

//
// MessageId: ERROR_SUCCESS_REBOOT_REQUIRED
//
// MessageText:
//
//  The requested operation is successful. Changes will not be effective until the system is rebooted.
//
pub const ERROR_SUCCESS_REBOOT_REQUIRED: i32 = 3010;

//
// MessageId: ERROR_SUCCESS_RESTART_REQUIRED
//
// MessageText:
//
//  The requested operation is successful. Changes will not be effective until the service is restarted.
//
pub const ERROR_SUCCESS_RESTART_REQUIRED: i32 = 3011;

//
// MessageId: ERROR_PRINTER_NOT_FOUND
//
// MessageText:
//
//  No printers were found.
//
pub const ERROR_PRINTER_NOT_FOUND: i32 = 3012;

//
// MessageId: ERROR_PRINTER_DRIVER_WARNED
//
// MessageText:
//
//  The printer driver is known to be unreliable.
//
pub const ERROR_PRINTER_DRIVER_WARNED: i32 = 3013;

//
// MessageId: ERROR_PRINTER_DRIVER_BLOCKED
//
// MessageText:
//
//  The printer driver is known to harm the system.
//
pub const ERROR_PRINTER_DRIVER_BLOCKED: i32 = 3014;

////////////////////////////////////
//                                //
//     Wins Error Codes           //
//                                //
////////////////////////////////////
//
// MessageId: ERROR_WINS_INTERNAL
//
// MessageText:
//
//  WINS encountered an error while processing the command.
//
pub const ERROR_WINS_INTERNAL: i32 = 4000;

//
// MessageId: ERROR_CAN_NOT_DEL_LOCAL_WINS
//
// MessageText:
//
//  The local WINS can not be deleted.
//
pub const ERROR_CAN_NOT_DEL_LOCAL_WINS: i32 = 4001;

//
// MessageId: ERROR_STATIC_INIT
//
// MessageText:
//
//  The importation from the file failed.
//
pub const ERROR_STATIC_INIT: i32 = 4002;

//
// MessageId: ERROR_INC_BACKUP
//
// MessageText:
//
//  The backup failed. Was a full backup done before?
//
pub const ERROR_INC_BACKUP: i32 = 4003;

//
// MessageId: ERROR_FULL_BACKUP
//
// MessageText:
//
//  The backup failed. Check the directory to which you are backing the database.
//
pub const ERROR_FULL_BACKUP: i32 = 4004;

//
// MessageId: ERROR_REC_NON_EXISTENT
//
// MessageText:
//
//  The name does not exist in the WINS database.
//
pub const ERROR_REC_NON_EXISTENT: i32 = 4005;

//
// MessageId: ERROR_RPL_NOT_ALLOWED
//
// MessageText:
//
//  Replication with a nonconfigured partner is not allowed.
//
pub const ERROR_RPL_NOT_ALLOWED: i32 = 4006;

////////////////////////////////////
//                                //
//     DHCP Error Codes           //
//                                //
////////////////////////////////////
//
// MessageId: ERROR_DHCP_ADDRESS_CONFLICT
//
// MessageText:
//
//  The DHCP client has obtained an IP address that is already in use on the network. The local interface will be disabled until the DHCP client can obtain a new address.
//
pub const ERROR_DHCP_ADDRESS_CONFLICT: i32 = 4100;

////////////////////////////////////
//                                //
//     WMI Error Codes            //
//                                //
////////////////////////////////////
//
// MessageId: ERROR_WMI_GUID_NOT_FOUND
//
// MessageText:
//
//  The GUID passed was not recognized as valid by a WMI data provider.
//
pub const ERROR_WMI_GUID_NOT_FOUND: i32 = 4200;

//
// MessageId: ERROR_WMI_INSTANCE_NOT_FOUND
//
// MessageText:
//
//  The instance name passed was not recognized as valid by a WMI data provider.
//
pub const ERROR_WMI_INSTANCE_NOT_FOUND: i32 = 4201;

//
// MessageId: ERROR_WMI_ITEMID_NOT_FOUND
//
// MessageText:
//
//  The data item ID passed was not recognized as valid by a WMI data provider.
//
pub const ERROR_WMI_ITEMID_NOT_FOUND: i32 = 4202;

//
// MessageId: ERROR_WMI_TRY_AGAIN
//
// MessageText:
//
//  The WMI request could not be completed and should be retried.
//
pub const ERROR_WMI_TRY_AGAIN: i32 = 4203;

//
// MessageId: ERROR_WMI_DP_NOT_FOUND
//
// MessageText:
//
//  The WMI data provider could not be located.
//
pub const ERROR_WMI_DP_NOT_FOUND: i32 = 4204;

//
// MessageId: ERROR_WMI_UNRESOLVED_INSTANCE_REF
//
// MessageText:
//
//  The WMI data provider references an instance set that has not been registered.
//
pub const ERROR_WMI_UNRESOLVED_INSTANCE_REF: i32 = 4205;

//
// MessageId: ERROR_WMI_ALREADY_ENABLED
//
// MessageText:
//
//  The WMI data block or event notification has already been enabled.
//
pub const ERROR_WMI_ALREADY_ENABLED: i32 = 4206;

//
// MessageId: ERROR_WMI_GUID_DISCONNECTED
//
// MessageText:
//
//  The WMI data block is no longer available.
//
pub const ERROR_WMI_GUID_DISCONNECTED: i32 = 4207;

//
// MessageId: ERROR_WMI_SERVER_UNAVAILABLE
//
// MessageText:
//
//  The WMI data service is not available.
//
pub const ERROR_WMI_SERVER_UNAVAILABLE: i32 = 4208;

//
// MessageId: ERROR_WMI_DP_FAILED
//
// MessageText:
//
//  The WMI data provider failed to carry out the request.
//
pub const ERROR_WMI_DP_FAILED: i32 = 4209;

//
// MessageId: ERROR_WMI_INVALID_MOF
//
// MessageText:
//
//  The WMI MOF information is not valid.
//
pub const ERROR_WMI_INVALID_MOF: i32 = 4210;

//
// MessageId: ERROR_WMI_INVALID_REGINFO
//
// MessageText:
//
//  The WMI registration information is not valid.
//
pub const ERROR_WMI_INVALID_REGINFO: i32 = 4211;

//
// MessageId: ERROR_WMI_ALREADY_DISABLED
//
// MessageText:
//
//  The WMI data block or event notification has already been disabled.
//
pub const ERROR_WMI_ALREADY_DISABLED: i32 = 4212;

//
// MessageId: ERROR_WMI_READ_ONLY
//
// MessageText:
//
//  The WMI data item or data block is read only.
//
pub const ERROR_WMI_READ_ONLY: i32 = 4213;

//
// MessageId: ERROR_WMI_SET_FAILURE
//
// MessageText:
//
//  The WMI data item or data block could not be changed.
//
pub const ERROR_WMI_SET_FAILURE: i32 = 4214;

//////////////////////////////////////////
//                                      //
// NT Media Services (RSM) Error Codes  //
//                                      //
//////////////////////////////////////////
//
// MessageId: ERROR_INVALID_MEDIA
//
// MessageText:
//
//  The media identifier does not represent a valid medium.
//
pub const ERROR_INVALID_MEDIA: i32 = 4300;

//
// MessageId: ERROR_INVALID_LIBRARY
//
// MessageText:
//
//  The library identifier does not represent a valid library.
//
pub const ERROR_INVALID_LIBRARY: i32 = 4301;

//
// MessageId: ERROR_INVALID_MEDIA_POOL
//
// MessageText:
//
//  The media pool identifier does not represent a valid media pool.
//
pub const ERROR_INVALID_MEDIA_POOL: i32 = 4302;

//
// MessageId: ERROR_DRIVE_MEDIA_MISMATCH
//
// MessageText:
//
//  The drive and medium are not compatible or exist in different libraries.
//
pub const ERROR_DRIVE_MEDIA_MISMATCH: i32 = 4303;

//
// MessageId: ERROR_MEDIA_OFFLINE
//
// MessageText:
//
//  The medium currently exists in an offline library and must be online to perform this operation.
//
pub const ERROR_MEDIA_OFFLINE: i32 = 4304;

//
// MessageId: ERROR_LIBRARY_OFFLINE
//
// MessageText:
//
//  The operation cannot be performed on an offline library.
//
pub const ERROR_LIBRARY_OFFLINE: i32 = 4305;

//
// MessageId: ERROR_EMPTY
//
// MessageText:
//
//  The library, drive, or media pool is empty.
//
pub const ERROR_EMPTY: i32 = 4306;

//
// MessageId: ERROR_NOT_EMPTY
//
// MessageText:
//
//  The library, drive, or media pool must be empty to perform this operation.
//
pub const ERROR_NOT_EMPTY: i32 = 4307;

//
// MessageId: ERROR_MEDIA_UNAVAILABLE
//
// MessageText:
//
//  No media is currently available in this media pool or library.
//
pub const ERROR_MEDIA_UNAVAILABLE: i32 = 4308;

//
// MessageId: ERROR_RESOURCE_DISABLED
//
// MessageText:
//
//  A resource required for this operation is disabled.
//
pub const ERROR_RESOURCE_DISABLED: i32 = 4309;

//
// MessageId: ERROR_INVALID_CLEANER
//
// MessageText:
//
//  The media identifier does not represent a valid cleaner.
//
pub const ERROR_INVALID_CLEANER: i32 = 4310;

//
// MessageId: ERROR_UNABLE_TO_CLEAN
//
// MessageText:
//
//  The drive cannot be cleaned or does not support cleaning.
//
pub const ERROR_UNABLE_TO_CLEAN: i32 = 4311;

//
// MessageId: ERROR_OBJECT_NOT_FOUND
//
// MessageText:
//
//  The object identifier does not represent a valid object.
//
pub const ERROR_OBJECT_NOT_FOUND: i32 = 4312;

//
// MessageId: ERROR_DATABASE_FAILURE
//
// MessageText:
//
//  Unable to read from or write to the database.
//
pub const ERROR_DATABASE_FAILURE: i32 = 4313;

//
// MessageId: ERROR_DATABASE_FULL
//
// MessageText:
//
//  The database is full.
//
pub const ERROR_DATABASE_FULL: i32 = 4314;

//
// MessageId: ERROR_MEDIA_INCOMPATIBLE
//
// MessageText:
//
//  The medium is not compatible with the device or media pool.
//
pub const ERROR_MEDIA_INCOMPATIBLE: i32 = 4315;

//
// MessageId: ERROR_RESOURCE_NOT_PRESENT
//
// MessageText:
//
//  The resource required for this operation does not exist.
//
pub const ERROR_RESOURCE_NOT_PRESENT: i32 = 4316;

//
// MessageId: ERROR_INVALID_OPERATION
//
// MessageText:
//
//  The operation identifier is not valid.
//
pub const ERROR_INVALID_OPERATION: i32 = 4317;

//
// MessageId: ERROR_MEDIA_NOT_AVAILABLE
//
// MessageText:
//
//  The media is not mounted or ready for use.
//
pub const ERROR_MEDIA_NOT_AVAILABLE: i32 = 4318;

//
// MessageId: ERROR_DEVICE_NOT_AVAILABLE
//
// MessageText:
//
//  The device is not ready for use.
//
pub const ERROR_DEVICE_NOT_AVAILABLE: i32 = 4319;

//
// MessageId: ERROR_REQUEST_REFUSED
//
// MessageText:
//
//  The operator or administrator has refused the request.
//
pub const ERROR_REQUEST_REFUSED: i32 = 4320;

//
// MessageId: ERROR_INVALID_DRIVE_OBJECT
//
// MessageText:
//
//  The drive identifier does not represent a valid drive.
//
pub const ERROR_INVALID_DRIVE_OBJECT: i32 = 4321;

//
// MessageId: ERROR_LIBRARY_FULL
//
// MessageText:
//
//  Library is full.  No slot is available for use.
//
pub const ERROR_LIBRARY_FULL: i32 = 4322;

//
// MessageId: ERROR_MEDIUM_NOT_ACCESSIBLE
//
// MessageText:
//
//  The transport cannot access the medium.
//
pub const ERROR_MEDIUM_NOT_ACCESSIBLE: i32 = 4323;

//
// MessageId: ERROR_UNABLE_TO_LOAD_MEDIUM
//
// MessageText:
//
//  Unable to load the medium into the drive.
//
pub const ERROR_UNABLE_TO_LOAD_MEDIUM: i32 = 4324;

//
// MessageId: ERROR_UNABLE_TO_INVENTORY_DRIVE
//
// MessageText:
//
//  Unable to retrieve the drive status.
//
pub const ERROR_UNABLE_TO_INVENTORY_DRIVE: i32 = 4325;

//
// MessageId: ERROR_UNABLE_TO_INVENTORY_SLOT
//
// MessageText:
//
//  Unable to retrieve the slot status.
//
pub const ERROR_UNABLE_TO_INVENTORY_SLOT: i32 = 4326;

//
// MessageId: ERROR_UNABLE_TO_INVENTORY_TRANSPORT
//
// MessageText:
//
//  Unable to retrieve status about the transport.
//
pub const ERROR_UNABLE_TO_INVENTORY_TRANSPORT: i32 = 4327;

//
// MessageId: ERROR_TRANSPORT_FULL
//
// MessageText:
//
//  Cannot use the transport because it is already in use.
//
pub const ERROR_TRANSPORT_FULL: i32 = 4328;

//
// MessageId: ERROR_CONTROLLING_IEPORT
//
// MessageText:
//
//  Unable to open or close the inject/eject port.
//
pub const ERROR_CONTROLLING_IEPORT: i32 = 4329;

//
// MessageId: ERROR_UNABLE_TO_EJECT_MOUNTED_MEDIA
//
// MessageText:
//
//  Unable to eject the medium because it is in a drive.
//
pub const ERROR_UNABLE_TO_EJECT_MOUNTED_MEDIA: i32 = 4330;

//
// MessageId: ERROR_CLEANER_SLOT_SET
//
// MessageText:
//
//  A cleaner slot is already reserved.
//
pub const ERROR_CLEANER_SLOT_SET: i32 = 4331;

//
// MessageId: ERROR_CLEANER_SLOT_NOT_SET
//
// MessageText:
//
//  A cleaner slot is not reserved.
//
pub const ERROR_CLEANER_SLOT_NOT_SET: i32 = 4332;

//
// MessageId: ERROR_CLEANER_CARTRIDGE_SPENT
//
// MessageText:
//
//  The cleaner cartridge has performed the maximum number of drive cleanings.
//
pub const ERROR_CLEANER_CARTRIDGE_SPENT: i32 = 4333;

//
// MessageId: ERROR_UNEXPECTED_OMID
//
// MessageText:
//
//  Unexpected on-medium identifier.
//
pub const ERROR_UNEXPECTED_OMID: i32 = 4334;

//
// MessageId: ERROR_CANT_DELETE_LAST_ITEM
//
// MessageText:
//
//  The last remaining item in this group or resource cannot be deleted.
//
pub const ERROR_CANT_DELETE_LAST_ITEM: i32 = 4335;

//
// MessageId: ERROR_MESSAGE_EXCEEDS_MAX_SIZE
//
// MessageText:
//
//  The message provided exceeds the maximum size allowed for this parameter.
//
pub const ERROR_MESSAGE_EXCEEDS_MAX_SIZE: i32 = 4336;

//
// MessageId: ERROR_VOLUME_CONTAINS_SYS_FILES
//
// MessageText:
//
//  The volume contains system or paging files.
//
pub const ERROR_VOLUME_CONTAINS_SYS_FILES: i32 = 4337;

//
// MessageId: ERROR_INDIGENOUS_TYPE
//
// MessageText:
//
//  The media type cannot be removed from this library since at least one drive in the library reports it can support this media type.
//
pub const ERROR_INDIGENOUS_TYPE: i32 = 4338;

//
// MessageId: ERROR_NO_SUPPORTING_DRIVES
//
// MessageText:
//
//  This offline media cannot be mounted on this system since no enabled drives are present which can be used.
//
pub const ERROR_NO_SUPPORTING_DRIVES: i32 = 4339;

//
// MessageId: ERROR_CLEANER_CARTRIDGE_INSTALLED
//
// MessageText:
//
//  A cleaner cartridge is present in the tape library.
//
pub const ERROR_CLEANER_CARTRIDGE_INSTALLED: i32 = 4340;

//
// MessageId: ERROR_IEPORT_FULL
//
// MessageText:
//
//  Cannot use the ieport because it is not empty.
//
pub const ERROR_IEPORT_FULL: i32 = 4341;

////////////////////////////////////////////
//                                        //
// NT Remote Storage Service Error Codes  //
//                                        //
////////////////////////////////////////////
//
// MessageId: ERROR_FILE_OFFLINE
//
// MessageText:
//
//  The remote storage service was not able to recall the file.
//
pub const ERROR_FILE_OFFLINE: i32 = 4350;

//
// MessageId: ERROR_REMOTE_STORAGE_NOT_ACTIVE
//
// MessageText:
//
//  The remote storage service is not operational at this time.
//
pub const ERROR_REMOTE_STORAGE_NOT_ACTIVE: i32 = 4351;

//
// MessageId: ERROR_REMOTE_STORAGE_MEDIA_ERROR
//
// MessageText:
//
//  The remote storage service encountered a media error.
//
pub const ERROR_REMOTE_STORAGE_MEDIA_ERROR: i32 = 4352;

////////////////////////////////////////////
//                                        //
// NT Reparse Points Error Codes          //
//                                        //
////////////////////////////////////////////
//
// MessageId: ERROR_NOT_A_REPARSE_POINT
//
// MessageText:
//
//  The file or directory is not a reparse point.
//
pub const ERROR_NOT_A_REPARSE_POINT: i32 = 4390;

//
// MessageId: ERROR_REPARSE_ATTRIBUTE_CONFLICT
//
// MessageText:
//
//  The reparse point attribute cannot be set because it conflicts with an existing attribute.
//
pub const ERROR_REPARSE_ATTRIBUTE_CONFLICT: i32 = 4391;

//
// MessageId: ERROR_INVALID_REPARSE_DATA
//
// MessageText:
//
//  The data present in the reparse point buffer is invalid.
//
pub const ERROR_INVALID_REPARSE_DATA: i32 = 4392;

//
// MessageId: ERROR_REPARSE_TAG_INVALID
//
// MessageText:
//
//  The tag present in the reparse point buffer is invalid.
//
pub const ERROR_REPARSE_TAG_INVALID: i32 = 4393;

//
// MessageId: ERROR_REPARSE_TAG_MISMATCH
//
// MessageText:
//
//  There is a mismatch between the tag specified in the request and the tag present in the reparse point.
//
//
pub const ERROR_REPARSE_TAG_MISMATCH: i32 = 4394;

////////////////////////////////////////////
//                                        //
// NT Single Instance Store Error Codes   //
//                                        //
////////////////////////////////////////////
//
// MessageId: ERROR_VOLUME_NOT_SIS_ENABLED
//
// MessageText:
//
//  Single Instance Storage is not available on this volume.
//
pub const ERROR_VOLUME_NOT_SIS_ENABLED: i32 = 4500;

////////////////////////////////////
//                                //
//     Cluster Error Codes        //
//                                //
////////////////////////////////////
//
// MessageId: ERROR_DEPENDENT_RESOURCE_EXISTS
//
// MessageText:
//
//  The cluster resource cannot be moved to another group because other resources are dependent on it.
//
pub const ERROR_DEPENDENT_RESOURCE_EXISTS: i32 = 5001;

//
// MessageId: ERROR_DEPENDENCY_NOT_FOUND
//
// MessageText:
//
//  The cluster resource dependency cannot be found.
//
pub const ERROR_DEPENDENCY_NOT_FOUND: i32 = 5002;

//
// MessageId: ERROR_DEPENDENCY_ALREADY_EXISTS
//
// MessageText:
//
//  The cluster resource cannot be made dependent on the specified resource because it is already dependent.
//
pub const ERROR_DEPENDENCY_ALREADY_EXISTS: i32 = 5003;

//
// MessageId: ERROR_RESOURCE_NOT_ONLINE
//
// MessageText:
//
//  The cluster resource is not online.
//
pub const ERROR_RESOURCE_NOT_ONLINE: i32 = 5004;

//
// MessageId: ERROR_HOST_NODE_NOT_AVAILABLE
//
// MessageText:
//
//  A cluster node is not available for this operation.
//
pub const ERROR_HOST_NODE_NOT_AVAILABLE: i32 = 5005;

//
// MessageId: ERROR_RESOURCE_NOT_AVAILABLE
//
// MessageText:
//
//  The cluster resource is not available.
//
pub const ERROR_RESOURCE_NOT_AVAILABLE: i32 = 5006;

//
// MessageId: ERROR_RESOURCE_NOT_FOUND
//
// MessageText:
//
//  The cluster resource could not be found.
//
pub const ERROR_RESOURCE_NOT_FOUND: i32 = 5007;

//
// MessageId: ERROR_SHUTDOWN_CLUSTER
//
// MessageText:
//
//  The cluster is being shut down.
//
pub const ERROR_SHUTDOWN_CLUSTER: i32 = 5008;

//
// MessageId: ERROR_CANT_EVICT_ACTIVE_NODE
//
// MessageText:
//
//  A cluster node cannot be evicted from the cluster unless the node is down or it is the last node.
//
pub const ERROR_CANT_EVICT_ACTIVE_NODE: i32 = 5009;

//
// MessageId: ERROR_OBJECT_ALREADY_EXISTS
//
// MessageText:
//
//  The object already exists.
//
pub const ERROR_OBJECT_ALREADY_EXISTS: i32 = 5010;

//
// MessageId: ERROR_OBJECT_IN_LIST
//
// MessageText:
//
//  The object is already in the list.
//
pub const ERROR_OBJECT_IN_LIST: i32 = 5011;

//
// MessageId: ERROR_GROUP_NOT_AVAILABLE
//
// MessageText:
//
//  The cluster group is not available for any new requests.
//
pub const ERROR_GROUP_NOT_AVAILABLE: i32 = 5012;

//
// MessageId: ERROR_GROUP_NOT_FOUND
//
// MessageText:
//
//  The cluster group could not be found.
//
pub const ERROR_GROUP_NOT_FOUND: i32 = 5013;

//
// MessageId: ERROR_GROUP_NOT_ONLINE
//
// MessageText:
//
//  The operation could not be completed because the cluster group is not online.
//
pub const ERROR_GROUP_NOT_ONLINE: i32 = 5014;

//
// MessageId: ERROR_HOST_NODE_NOT_RESOURCE_OWNER
//
// MessageText:
//
//  The cluster node is not the owner of the resource.
//
pub const ERROR_HOST_NODE_NOT_RESOURCE_OWNER: i32 = 5015;

//
// MessageId: ERROR_HOST_NODE_NOT_GROUP_OWNER
//
// MessageText:
//
//  The cluster node is not the owner of the group.
//
pub const ERROR_HOST_NODE_NOT_GROUP_OWNER: i32 = 5016;

//
// MessageId: ERROR_RESMON_CREATE_FAILED
//
// MessageText:
//
//  The cluster resource could not be created in the specified resource monitor.
//
pub const ERROR_RESMON_CREATE_FAILED: i32 = 5017;

//
// MessageId: ERROR_RESMON_ONLINE_FAILED
//
// MessageText:
//
//  The cluster resource could not be brought online by the resource monitor.
//
pub const ERROR_RESMON_ONLINE_FAILED: i32 = 5018;

//
// MessageId: ERROR_RESOURCE_ONLINE
//
// MessageText:
//
//  The operation could not be completed because the cluster resource is online.
//
pub const ERROR_RESOURCE_ONLINE: i32 = 5019;

//
// MessageId: ERROR_QUORUM_RESOURCE
//
// MessageText:
//
//  The cluster resource could not be deleted or brought offline because it is the quorum resource.
//
pub const ERROR_QUORUM_RESOURCE: i32 = 5020;

//
// MessageId: ERROR_NOT_QUORUM_CAPABLE
//
// MessageText:
//
//  The cluster could not make the specified resource a quorum resource because it is not capable of being a quorum resource.
//
pub const ERROR_NOT_QUORUM_CAPABLE: i32 = 5021;

//
// MessageId: ERROR_CLUSTER_SHUTTING_DOWN
//
// MessageText:
//
//  The cluster software is shutting down.
//
pub const ERROR_CLUSTER_SHUTTING_DOWN: i32 = 5022;

//
// MessageId: ERROR_INVALID_STATE
//
// MessageText:
//
//  The group or resource is not in the correct state to perform the requested operation.
//
pub const ERROR_INVALID_STATE: i32 = 5023;

//
// MessageId: ERROR_RESOURCE_PROPERTIES_STORED
//
// MessageText:
//
//  The properties were stored but not all changes will take effect until the next time the resource is brought online.
//
pub const ERROR_RESOURCE_PROPERTIES_STORED: i32 = 5024;

//
// MessageId: ERROR_NOT_QUORUM_CLASS
//
// MessageText:
//
//  The cluster could not make the specified resource a quorum resource because it does not belong to a shared storage class.
//
pub const ERROR_NOT_QUORUM_CLASS: i32 = 5025;

//
// MessageId: ERROR_CORE_RESOURCE
//
// MessageText:
//
//  The cluster resource could not be deleted since it is a core resource.
//
pub const ERROR_CORE_RESOURCE: i32 = 5026;

//
// MessageId: ERROR_QUORUM_RESOURCE_ONLINE_FAILED
//
// MessageText:
//
//  The quorum resource failed to come online.
//
pub const ERROR_QUORUM_RESOURCE_ONLINE_FAILED: i32 = 5027;

//
// MessageId: ERROR_QUORUMLOG_OPEN_FAILED
//
// MessageText:
//
//  The quorum log could not be created or mounted successfully.
//
pub const ERROR_QUORUMLOG_OPEN_FAILED: i32 = 5028;

//
// MessageId: ERROR_CLUSTERLOG_CORRUPT
//
// MessageText:
//
//  The cluster log is corrupt.
//
pub const ERROR_CLUSTERLOG_CORRUPT: i32 = 5029;

//
// MessageId: ERROR_CLUSTERLOG_RECORD_EXCEEDS_MAXSIZE
//
// MessageText:
//
//  The record could not be written to the cluster log since it exceeds the maximum size.
//
pub const ERROR_CLUSTERLOG_RECORD_EXCEEDS_MAXSIZE: i32 = 5030;

//
// MessageId: ERROR_CLUSTERLOG_EXCEEDS_MAXSIZE
//
// MessageText:
//
//  The cluster log exceeds its maximum size.
//
pub const ERROR_CLUSTERLOG_EXCEEDS_MAXSIZE: i32 = 5031;

//
// MessageId: ERROR_CLUSTERLOG_CHKPOINT_NOT_FOUND
//
// MessageText:
//
//  No checkpoint record was found in the cluster log.
//
pub const ERROR_CLUSTERLOG_CHKPOINT_NOT_FOUND: i32 = 5032;

//
// MessageId: ERROR_CLUSTERLOG_NOT_ENOUGH_SPACE
//
// MessageText:
//
//  The minimum required disk space needed for logging is not available.
//
pub const ERROR_CLUSTERLOG_NOT_ENOUGH_SPACE: i32 = 5033;

//
// MessageId: ERROR_QUORUM_OWNER_ALIVE
//
// MessageText:
//
//  The cluster node failed to take control of the quorum resource because the resource is owned by another active node.
//
pub const ERROR_QUORUM_OWNER_ALIVE: i32 = 5034;

//
// MessageId: ERROR_NETWORK_NOT_AVAILABLE
//
// MessageText:
//
//  A cluster network is not available for this operation.
//
pub const ERROR_NETWORK_NOT_AVAILABLE: i32 = 5035;

//
// MessageId: ERROR_NODE_NOT_AVAILABLE
//
// MessageText:
//
//  A cluster node is not available for this operation.
//
pub const ERROR_NODE_NOT_AVAILABLE: i32 = 5036;

//
// MessageId: ERROR_ALL_NODES_NOT_AVAILABLE
//
// MessageText:
//
//  All cluster nodes must be running to perform this operation.
//
pub const ERROR_ALL_NODES_NOT_AVAILABLE: i32 = 5037;

//
// MessageId: ERROR_RESOURCE_FAILED
//
// MessageText:
//
//  A cluster resource failed.
//
pub const ERROR_RESOURCE_FAILED: i32 = 5038;

//
// MessageId: ERROR_CLUSTER_INVALID_NODE
//
// MessageText:
//
//  The cluster node is not valid.
//
pub const ERROR_CLUSTER_INVALID_NODE: i32 = 5039;

//
// MessageId: ERROR_CLUSTER_NODE_EXISTS
//
// MessageText:
//
//  The cluster node already exists.
//
pub const ERROR_CLUSTER_NODE_EXISTS: i32 = 5040;

//
// MessageId: ERROR_CLUSTER_JOIN_IN_PROGRESS
//
// MessageText:
//
//  A node is in the process of joining the cluster.
//
pub const ERROR_CLUSTER_JOIN_IN_PROGRESS: i32 = 5041;

//
// MessageId: ERROR_CLUSTER_NODE_NOT_FOUND
//
// MessageText:
//
//  The cluster node was not found.
//
pub const ERROR_CLUSTER_NODE_NOT_FOUND: i32 = 5042;

//
// MessageId: ERROR_CLUSTER_LOCAL_NODE_NOT_FOUND
//
// MessageText:
//
//  The cluster local node information was not found.
//
pub const ERROR_CLUSTER_LOCAL_NODE_NOT_FOUND: i32 = 5043;

//
// MessageId: ERROR_CLUSTER_NETWORK_EXISTS
//
// MessageText:
//
//  The cluster network already exists.
//
pub const ERROR_CLUSTER_NETWORK_EXISTS: i32 = 5044;

//
// MessageId: ERROR_CLUSTER_NETWORK_NOT_FOUND
//
// MessageText:
//
//  The cluster network was not found.
//
pub const ERROR_CLUSTER_NETWORK_NOT_FOUND: i32 = 5045;

//
// MessageId: ERROR_CLUSTER_NETINTERFACE_EXISTS
//
// MessageText:
//
//  The cluster network interface already exists.
//
pub const ERROR_CLUSTER_NETINTERFACE_EXISTS: i32 = 5046;

//
// MessageId: ERROR_CLUSTER_NETINTERFACE_NOT_FOUND
//
// MessageText:
//
//  The cluster network interface was not found.
//
pub const ERROR_CLUSTER_NETINTERFACE_NOT_FOUND: i32 = 5047;

//
// MessageId: ERROR_CLUSTER_INVALID_REQUEST
//
// MessageText:
//
//  The cluster request is not valid for this object.
//
pub const ERROR_CLUSTER_INVALID_REQUEST: i32 = 5048;

//
// MessageId: ERROR_CLUSTER_INVALID_NETWORK_PROVIDER
//
// MessageText:
//
//  The cluster network provider is not valid.
//
pub const ERROR_CLUSTER_INVALID_NETWORK_PROVIDER: i32 = 5049;

//
// MessageId: ERROR_CLUSTER_NODE_DOWN
//
// MessageText:
//
//  The cluster node is down.
//
pub const ERROR_CLUSTER_NODE_DOWN: i32 = 5050;

//
// MessageId: ERROR_CLUSTER_NODE_UNREACHABLE
//
// MessageText:
//
//  The cluster node is not reachable.
//
pub const ERROR_CLUSTER_NODE_UNREACHABLE: i32 = 5051;

//
// MessageId: ERROR_CLUSTER_NODE_NOT_MEMBER
//
// MessageText:
//
//  The cluster node is not a member of the cluster.
//
pub const ERROR_CLUSTER_NODE_NOT_MEMBER: i32 = 5052;

//
// MessageId: ERROR_CLUSTER_JOIN_NOT_IN_PROGRESS
//
// MessageText:
//
//  A cluster join operation is not in progress.
//
pub const ERROR_CLUSTER_JOIN_NOT_IN_PROGRESS: i32 = 5053;

//
// MessageId: ERROR_CLUSTER_INVALID_NETWORK
//
// MessageText:
//
//  The cluster network is not valid.
//
pub const ERROR_CLUSTER_INVALID_NETWORK: i32 = 5054;

//
// MessageId: ERROR_CLUSTER_NODE_UP
//
// MessageText:
//
//  The cluster node is up.
//
pub const ERROR_CLUSTER_NODE_UP: i32 = 5056;

//
// MessageId: ERROR_CLUSTER_IPADDR_IN_USE
//
// MessageText:
//
//  The cluster IP address is already in use.
//
pub const ERROR_CLUSTER_IPADDR_IN_USE: i32 = 5057;

//
// MessageId: ERROR_CLUSTER_NODE_NOT_PAUSED
//
// MessageText:
//
//  The cluster node is not paused.
//
pub const ERROR_CLUSTER_NODE_NOT_PAUSED: i32 = 5058;

//
// MessageId: ERROR_CLUSTER_NO_SECURITY_CONTEXT
//
// MessageText:
//
//  No cluster security context is available.
//
pub const ERROR_CLUSTER_NO_SECURITY_CONTEXT: i32 = 5059;

//
// MessageId: ERROR_CLUSTER_NETWORK_NOT_INTERNAL
//
// MessageText:
//
//  The cluster network is not configured for internal cluster communication.
//
pub const ERROR_CLUSTER_NETWORK_NOT_INTERNAL: i32 = 5060;

//
// MessageId: ERROR_CLUSTER_NODE_ALREADY_UP
//
// MessageText:
//
//  The cluster node is already up.
//
pub const ERROR_CLUSTER_NODE_ALREADY_UP: i32 = 5061;

//
// MessageId: ERROR_CLUSTER_NODE_ALREADY_DOWN
//
// MessageText:
//
//  The cluster node is already down.
//
pub const ERROR_CLUSTER_NODE_ALREADY_DOWN: i32 = 5062;

//
// MessageId: ERROR_CLUSTER_NETWORK_ALREADY_ONLINE
//
// MessageText:
//
//  The cluster network is already online.
//
pub const ERROR_CLUSTER_NETWORK_ALREADY_ONLINE: i32 = 5063;

//
// MessageId: ERROR_CLUSTER_NETWORK_ALREADY_OFFLINE
//
// MessageText:
//
//  The cluster network is already offline.
//
pub const ERROR_CLUSTER_NETWORK_ALREADY_OFFLINE: i32 = 5064;

//
// MessageId: ERROR_CLUSTER_NODE_ALREADY_MEMBER
//
// MessageText:
//
//  The cluster node is already a member of the cluster.
//
pub const ERROR_CLUSTER_NODE_ALREADY_MEMBER: i32 = 5065;

//
// MessageId: ERROR_CLUSTER_LAST_INTERNAL_NETWORK
//
// MessageText:
//
//  The cluster network is the only one configured for internal cluster communication between two or more active cluster nodes. The internal communication capability cannot be removed from the network.
//
pub const ERROR_CLUSTER_LAST_INTERNAL_NETWORK: i32 = 5066;

//
// MessageId: ERROR_CLUSTER_NETWORK_HAS_DEPENDENTS
//
// MessageText:
//
//  One or more cluster resources depend on the network to provide service to clients. The client access capability cannot be removed from the network.
//
pub const ERROR_CLUSTER_NETWORK_HAS_DEPENDENTS: i32 = 5067;

//
// MessageId: ERROR_INVALID_OPERATION_ON_QUORUM
//
// MessageText:
//
//  This operation cannot be performed on the cluster resource as it the quorum resource. You may not bring the quorum resource offline or modify its possible owners list.
//
pub const ERROR_INVALID_OPERATION_ON_QUORUM: i32 = 5068;

//
// MessageId: ERROR_DEPENDENCY_NOT_ALLOWED
//
// MessageText:
//
//  The cluster quorum resource is not allowed to have any dependencies.
//
pub const ERROR_DEPENDENCY_NOT_ALLOWED: i32 = 5069;

//
// MessageId: ERROR_CLUSTER_NODE_PAUSED
//
// MessageText:
//
//  The cluster node is paused.
//
pub const ERROR_CLUSTER_NODE_PAUSED: i32 = 5070;

//
// MessageId: ERROR_NODE_CANT_HOST_RESOURCE
//
// MessageText:
//
//  The cluster resource cannot be brought online. The owner node cannot run this resource.
//
pub const ERROR_NODE_CANT_HOST_RESOURCE: i32 = 5071;

//
// MessageId: ERROR_CLUSTER_NODE_NOT_READY
//
// MessageText:
//
//  The cluster node is not ready to perform the requested operation.
//
pub const ERROR_CLUSTER_NODE_NOT_READY: i32 = 5072;

//
// MessageId: ERROR_CLUSTER_NODE_SHUTTING_DOWN
//
// MessageText:
//
//  The cluster node is shutting down.
//
pub const ERROR_CLUSTER_NODE_SHUTTING_DOWN: i32 = 5073;

//
// MessageId: ERROR_CLUSTER_JOIN_ABORTED
//
// MessageText:
//
//  The cluster join operation was aborted.
//
pub const ERROR_CLUSTER_JOIN_ABORTED: i32 = 5074;

//
// MessageId: ERROR_CLUSTER_INCOMPATIBLE_VERSIONS
//
// MessageText:
//
//  The cluster join operation failed due to incompatible software versions between the joining node and its sponsor.
//
pub const ERROR_CLUSTER_INCOMPATIBLE_VERSIONS: i32 = 5075;

//
// MessageId: ERROR_CLUSTER_MAXNUM_OF_RESOURCES_EXCEEDED
//
// MessageText:
//
//  This resource cannot be created because the cluster has reached the limit on the number of resources it can monitor.
//
pub const ERROR_CLUSTER_MAXNUM_OF_RESOURCES_EXCEEDED: i32 = 5076;

//
// MessageId: ERROR_CLUSTER_SYSTEM_CONFIG_CHANGED
//
// MessageText:
//
//  The system configuration changed during the cluster join or form operation. The join or form operation was aborted.
//
pub const ERROR_CLUSTER_SYSTEM_CONFIG_CHANGED: i32 = 5077;

//
// MessageId: ERROR_CLUSTER_RESOURCE_TYPE_NOT_FOUND
//
// MessageText:
//
//  The specified resource type was not found.
//
pub const ERROR_CLUSTER_RESOURCE_TYPE_NOT_FOUND: i32 = 5078;

//
// MessageId: ERROR_CLUSTER_RESTYPE_NOT_SUPPORTED
//
// MessageText:
//
//  The specified node does not support a resource of this type.  This may be due to version inconsistencies or due to the absence of the resource DLL on this node.
//
pub const ERROR_CLUSTER_RESTYPE_NOT_SUPPORTED: i32 = 5079;

//
// MessageId: ERROR_CLUSTER_RESNAME_NOT_FOUND
//
// MessageText:
//
//  The specified resource name is not supported by this resource DLL. This may be due to a bad (or changed) name supplied to the resource DLL.
//
pub const ERROR_CLUSTER_RESNAME_NOT_FOUND: i32 = 5080;

//
// MessageId: ERROR_CLUSTER_NO_RPC_PACKAGES_REGISTERED
//
// MessageText:
//
//  No authentication package could be registered with the RPC server.
//
pub const ERROR_CLUSTER_NO_RPC_PACKAGES_REGISTERED: i32 = 5081;

//
// MessageId: ERROR_CLUSTER_OWNER_NOT_IN_PREFLIST
//
// MessageText:
//
//  You cannot bring the group online because the owner of the group is not in the preferred list for the group. To change the owner node for the group, move the group.
//
pub const ERROR_CLUSTER_OWNER_NOT_IN_PREFLIST: i32 = 5082;

//
// MessageId: ERROR_CLUSTER_DATABASE_SEQMISMATCH
//
// MessageText:
//
//  The join operation failed because the cluster database sequence number has changed or is incompatible with the locker node. This may happen during a join operation if the cluster database was changing during the join.
//
pub const ERROR_CLUSTER_DATABASE_SEQMISMATCH: i32 = 5083;

//
// MessageId: ERROR_RESMON_INVALID_STATE
//
// MessageText:
//
//  The resource monitor will not allow the fail operation to be performed while the resource is in its current state. This may happen if the resource is in a pending state.
//
pub const ERROR_RESMON_INVALID_STATE: i32 = 5084;

//
// MessageId: ERROR_CLUSTER_GUM_NOT_LOCKER
//
// MessageText:
//
//  A non locker code got a request to reserve the lock for making global updates.
//
pub const ERROR_CLUSTER_GUM_NOT_LOCKER: i32 = 5085;

//
// MessageId: ERROR_QUORUM_DISK_NOT_FOUND
//
// MessageText:
//
//  The quorum disk could not be located by the cluster service.
//
pub const ERROR_QUORUM_DISK_NOT_FOUND: i32 = 5086;

//
// MessageId: ERROR_DATABASE_BACKUP_CORRUPT
//
// MessageText:
//
//  The backed up cluster database is possibly corrupt.
//
pub const ERROR_DATABASE_BACKUP_CORRUPT: i32 = 5087;

//
// MessageId: ERROR_CLUSTER_NODE_ALREADY_HAS_DFS_ROOT
//
// MessageText:
//
//  A DFS root already exists in this cluster node.
//
pub const ERROR_CLUSTER_NODE_ALREADY_HAS_DFS_ROOT: i32 = 5088;

//
// MessageId: ERROR_RESOURCE_PROPERTY_UNCHANGEABLE
//
// MessageText:
//
//  An attempt to modify a resource property failed because it conflicts with another existing property.
//
pub const ERROR_RESOURCE_PROPERTY_UNCHANGEABLE: i32 = 5089;

/*
 Codes from 4300 through 5889 overlap with codes in ds\published\inc\apperr2.w.
 Do not add any more error codes in that range.
*/
//
// MessageId: ERROR_CLUSTER_MEMBERSHIP_INVALID_STATE
//
// MessageText:
//
//  An operation was attempted that is incompatible with the current membership state of the node.
//
pub const ERROR_CLUSTER_MEMBERSHIP_INVALID_STATE: i32 = 5890;

//
// MessageId: ERROR_CLUSTER_QUORUMLOG_NOT_FOUND
//
// MessageText:
//
//  The quorum resource does not contain the quorum log.
//
pub const ERROR_CLUSTER_QUORUMLOG_NOT_FOUND: i32 = 5891;

//
// MessageId: ERROR_CLUSTER_MEMBERSHIP_HALT
//
// MessageText:
//
//  The membership engine requested shutdown of the cluster service on this node.
//
pub const ERROR_CLUSTER_MEMBERSHIP_HALT: i32 = 5892;

//
// MessageId: ERROR_CLUSTER_INSTANCE_ID_MISMATCH
//
// MessageText:
//
//  The join operation failed because the cluster instance ID of the joining node does not match the cluster instance ID of the sponsor node.
//
pub const ERROR_CLUSTER_INSTANCE_ID_MISMATCH: i32 = 5893;

//
// MessageId: ERROR_CLUSTER_NETWORK_NOT_FOUND_FOR_IP
//
// MessageText:
//
//  A matching network for the specified IP address could not be found. Please also specify a subnet mask and a cluster network.
//
pub const ERROR_CLUSTER_NETWORK_NOT_FOUND_FOR_IP: i32 = 5894;

//
// MessageId: ERROR_CLUSTER_PROPERTY_DATA_TYPE_MISMATCH
//
// MessageText:
//
//  The actual data type of the property did not match the expected data type of the property.
//
pub const ERROR_CLUSTER_PROPERTY_DATA_TYPE_MISMATCH: i32 = 5895;

//
// MessageId: ERROR_CLUSTER_EVICT_WITHOUT_CLEANUP
//
// MessageText:
//
//  The cluster node was evicted from the cluster successfully, but the node was not cleaned up.  Extended status information explaining why the node was not cleaned up is available.
//
pub const ERROR_CLUSTER_EVICT_WITHOUT_CLEANUP: i32 = 5896;

//
// MessageId: ERROR_CLUSTER_PARAMETER_MISMATCH
//
// MessageText:
//
//  Two or more parameter values specified for a resource's properties are in conflict.
//
pub const ERROR_CLUSTER_PARAMETER_MISMATCH: i32 = 5897;

//
// MessageId: ERROR_NODE_CANNOT_BE_CLUSTERED
//
// MessageText:
//
//  This computer cannot be made a member of a cluster.
//
pub const ERROR_NODE_CANNOT_BE_CLUSTERED: i32 = 5898;

//
// MessageId: ERROR_CLUSTER_WRONG_OS_VERSION
//
// MessageText:
//
//  This computer cannot be made a member of a cluster because it does not have the correct version of Windows installed.
//
pub const ERROR_CLUSTER_WRONG_OS_VERSION: i32 = 5899;

//
// MessageId: ERROR_CLUSTER_CANT_CREATE_DUP_CLUSTER_NAME
//
// MessageText:
//
//  A cluster cannot be created with the specified cluster name because that cluster name is already in use. Specify a different name for the cluster.
//
pub const ERROR_CLUSTER_CANT_CREATE_DUP_CLUSTER_NAME: i32 = 5900;

//
// MessageId: ERROR_CLUSCFG_ALREADY_COMMITTED
//
// MessageText:
//
//  The cluster configuration action has already been committed.
//
pub const ERROR_CLUSCFG_ALREADY_COMMITTED: i32 = 5901;

//
// MessageId: ERROR_CLUSCFG_ROLLBACK_FAILED
//
// MessageText:
//
//  The cluster configuration action could not be rolled back.
//
pub const ERROR_CLUSCFG_ROLLBACK_FAILED: i32 = 5902;

//
// MessageId: ERROR_CLUSCFG_SYSTEM_DISK_DRIVE_LETTER_CONFLICT
//
// MessageText:
//
//  The drive letter assigned to a system disk on one node conflicted with the drive letter assigned to a disk on another node.
//
pub const ERROR_CLUSCFG_SYSTEM_DISK_DRIVE_LETTER_CONFLICT: i32 = 5903;

//
// MessageId: ERROR_CLUSTER_OLD_VERSION
//
// MessageText:
//
//  One or more nodes in the cluster are running a version of Windows that does not support this operation.
//
pub const ERROR_CLUSTER_OLD_VERSION: i32 = 5904;

//
// MessageId: ERROR_CLUSTER_MISMATCHED_COMPUTER_ACCT_NAME
//
// MessageText:
//
//  The name of the corresponding computer account doesn't match the Network Name for this resource.
//
pub const ERROR_CLUSTER_MISMATCHED_COMPUTER_ACCT_NAME: i32 = 5905;

////////////////////////////////////
//                                //
//     EFS Error Codes            //
//                                //
////////////////////////////////////
//
// MessageId: ERROR_ENCRYPTION_FAILED
//
// MessageText:
//
//  The specified file could not be encrypted.
//
pub const ERROR_ENCRYPTION_FAILED: i32 = 6000;

//
// MessageId: ERROR_DECRYPTION_FAILED
//
// MessageText:
//
//  The specified file could not be decrypted.
//
pub const ERROR_DECRYPTION_FAILED: i32 = 6001;

//
// MessageId: ERROR_FILE_ENCRYPTED
//
// MessageText:
//
//  The specified file is encrypted and the user does not have the ability to decrypt it.
//
pub const ERROR_FILE_ENCRYPTED: i32 = 6002;

//
// MessageId: ERROR_NO_RECOVERY_POLICY
//
// MessageText:
//
//  There is no valid encryption recovery policy configured for this system.
//
pub const ERROR_NO_RECOVERY_POLICY: i32 = 6003;

//
// MessageId: ERROR_NO_EFS
//
// MessageText:
//
//  The required encryption driver is not loaded for this system.
//
pub const ERROR_NO_EFS: i32 = 6004;

//
// MessageId: ERROR_WRONG_EFS
//
// MessageText:
//
//  The file was encrypted with a different encryption driver than is currently loaded.
//
pub const ERROR_WRONG_EFS: i32 = 6005;

//
// MessageId: ERROR_NO_USER_KEYS
//
// MessageText:
//
//  There are no EFS keys defined for the user.
//
pub const ERROR_NO_USER_KEYS: i32 = 6006;

//
// MessageId: ERROR_FILE_NOT_ENCRYPTED
//
// MessageText:
//
//  The specified file is not encrypted.
//
pub const ERROR_FILE_NOT_ENCRYPTED: i32 = 6007;

//
// MessageId: ERROR_NOT_EXPORT_FORMAT
//
// MessageText:
//
//  The specified file is not in the defined EFS export format.
//
pub const ERROR_NOT_EXPORT_FORMAT: i32 = 6008;

//
// MessageId: ERROR_FILE_READ_ONLY
//
// MessageText:
//
//  The specified file is read only.
//
pub const ERROR_FILE_READ_ONLY: i32 = 6009;

//
// MessageId: ERROR_DIR_EFS_DISALLOWED
//
// MessageText:
//
//  The directory has been disabled for encryption.
//
pub const ERROR_DIR_EFS_DISALLOWED: i32 = 6010;

//
// MessageId: ERROR_EFS_SERVER_NOT_TRUSTED
//
// MessageText:
//
//  The server is not trusted for remote encryption operation.
//
pub const ERROR_EFS_SERVER_NOT_TRUSTED: i32 = 6011;

//
// MessageId: ERROR_BAD_RECOVERY_POLICY
//
// MessageText:
//
//  Recovery policy configured for this system contains invalid recovery certificate.
//
pub const ERROR_BAD_RECOVERY_POLICY: i32 = 6012;

//
// MessageId: ERROR_EFS_ALG_BLOB_TOO_BIG
//
// MessageText:
//
//  The encryption algorithm used on the source file needs a bigger key buffer than the one on the destination file.
//
pub const ERROR_EFS_ALG_BLOB_TOO_BIG: i32 = 6013;

//
// MessageId: ERROR_VOLUME_NOT_SUPPORT_EFS
//
// MessageText:
//
//  The disk partition does not support file encryption.
//
pub const ERROR_VOLUME_NOT_SUPPORT_EFS: i32 = 6014;

//
// MessageId: ERROR_EFS_DISABLED
//
// MessageText:
//
//  This machine is disabled for file encryption.
//
pub const ERROR_EFS_DISABLED: i32 = 6015;

//
// MessageId: ERROR_EFS_VERSION_NOT_SUPPORT
//
// MessageText:
//
//  A newer system is required to decrypt this encrypted file.
//
pub const ERROR_EFS_VERSION_NOT_SUPPORT: i32 = 6016;

// This message number is for historical purposes and cannot be changed or re-used.
//
// MessageId: ERROR_NO_BROWSER_SERVERS_FOUND
//
// MessageText:
//
//  The list of servers for this workgroup is not currently available
//
pub const ERROR_NO_BROWSER_SERVERS_FOUND: i32 = 6118;

//////////////////////////////////////////////////////////////////
//                                                              //
// Task Scheduler Error Codes that NET START must understand    //
//                                                              //
//////////////////////////////////////////////////////////////////
//
// MessageId: SCHED_E_SERVICE_NOT_LOCALSYSTEM
//
// MessageText:
//
//  The Task Scheduler service must be configured to run in the System account to function properly.  Individual tasks may be configured to run in other accounts.
//
pub const SCHED_E_SERVICE_NOT_LOCALSYSTEM: i32 = 6200;

////////////////////////////////////
//                                //
// Terminal Server Error Codes    //
//                                //
////////////////////////////////////
//
// MessageId: ERROR_CTX_WINSTATION_NAME_INVALID
//
// MessageText:
//
//  The specified session name is invalid.
//
pub const ERROR_CTX_WINSTATION_NAME_INVALID: i32 = 7001;

//
// MessageId: ERROR_CTX_INVALID_PD
//
// MessageText:
//
//  The specified protocol driver is invalid.
//
pub const ERROR_CTX_INVALID_PD: i32 = 7002;

//
// MessageId: ERROR_CTX_PD_NOT_FOUND
//
// MessageText:
//
//  The specified protocol driver was not found in the system path.
//
pub const ERROR_CTX_PD_NOT_FOUND: i32 = 7003;

//
// MessageId: ERROR_CTX_WD_NOT_FOUND
//
// MessageText:
//
//  The specified terminal connection driver was not found in the system path.
//
pub const ERROR_CTX_WD_NOT_FOUND: i32 = 7004;

//
// MessageId: ERROR_CTX_CANNOT_MAKE_EVENTLOG_ENTRY
//
// MessageText:
//
//  A registry key for event logging could not be created for this session.
//
pub const ERROR_CTX_CANNOT_MAKE_EVENTLOG_ENTRY: i32 = 7005;

//
// MessageId: ERROR_CTX_SERVICE_NAME_COLLISION
//
// MessageText:
//
//  A service with the same name already exists on the system.
//
pub const ERROR_CTX_SERVICE_NAME_COLLISION: i32 = 7006;

//
// MessageId: ERROR_CTX_CLOSE_PENDING
//
// MessageText:
//
//  A close operation is pending on the session.
//
pub const ERROR_CTX_CLOSE_PENDING: i32 = 7007;

//
// MessageId: ERROR_CTX_NO_OUTBUF
//
// MessageText:
//
//  There are no free output buffers available.
//
pub const ERROR_CTX_NO_OUTBUF: i32 = 7008;

//
// MessageId: ERROR_CTX_MODEM_INF_NOT_FOUND
//
// MessageText:
//
//  The MODEM.INF file was not found.
//
pub const ERROR_CTX_MODEM_INF_NOT_FOUND: i32 = 7009;

//
// MessageId: ERROR_CTX_INVALID_MODEMNAME
//
// MessageText:
//
//  The modem name was not found in MODEM.INF.
//
pub const ERROR_CTX_INVALID_MODEMNAME: i32 = 7010;

//
// MessageId: ERROR_CTX_MODEM_RESPONSE_ERROR
//
// MessageText:
//
//  The modem did not accept the command sent to it. Verify that the configured modem name matches the attached modem.
//
pub const ERROR_CTX_MODEM_RESPONSE_ERROR: i32 = 7011;

//
// MessageId: ERROR_CTX_MODEM_RESPONSE_TIMEOUT
//
// MessageText:
//
//  The modem did not respond to the command sent to it. Verify that the modem is properly cabled and powered on.
//
pub const ERROR_CTX_MODEM_RESPONSE_TIMEOUT: i32 = 7012;

//
// MessageId: ERROR_CTX_MODEM_RESPONSE_NO_CARRIER
//
// MessageText:
//
//  Carrier detect has failed or carrier has been dropped due to disconnect.
//
pub const ERROR_CTX_MODEM_RESPONSE_NO_CARRIER: i32 = 7013;

//
// MessageId: ERROR_CTX_MODEM_RESPONSE_NO_DIALTONE
//
// MessageText:
//
//  Dial tone not detected within the required time. Verify that the phone cable is properly attached and functional.
//
pub const ERROR_CTX_MODEM_RESPONSE_NO_DIALTONE: i32 = 7014;

//
// MessageId: ERROR_CTX_MODEM_RESPONSE_BUSY
//
// MessageText:
//
//  Busy signal detected at remote site on callback.
//
pub const ERROR_CTX_MODEM_RESPONSE_BUSY: i32 = 7015;

//
// MessageId: ERROR_CTX_MODEM_RESPONSE_VOICE
//
// MessageText:
//
//  Voice detected at remote site on callback.
//
pub const ERROR_CTX_MODEM_RESPONSE_VOICE: i32 = 7016;

//
// MessageId: ERROR_CTX_TD_ERROR
//
// MessageText:
//
//  Transport driver error
//
pub const ERROR_CTX_TD_ERROR: i32 = 7017;

//
// MessageId: ERROR_CTX_WINSTATION_NOT_FOUND
//
// MessageText:
//
//  The specified session cannot be found.
//
pub const ERROR_CTX_WINSTATION_NOT_FOUND: i32 = 7022;

//
// MessageId: ERROR_CTX_WINSTATION_ALREADY_EXISTS
//
// MessageText:
//
//  The specified session name is already in use.
//
pub const ERROR_CTX_WINSTATION_ALREADY_EXISTS: i32 = 7023;

//
// MessageId: ERROR_CTX_WINSTATION_BUSY
//
// MessageText:
//
//  The requested operation cannot be completed because the terminal connection is currently busy processing a connect, disconnect, reset, or delete operation.
//
pub const ERROR_CTX_WINSTATION_BUSY: i32 = 7024;

//
// MessageId: ERROR_CTX_BAD_VIDEO_MODE
//
// MessageText:
//
//  An attempt has been made to connect to a session whose video mode is not supported by the current client.
//
pub const ERROR_CTX_BAD_VIDEO_MODE: i32 = 7025;

//
// MessageId: ERROR_CTX_GRAPHICS_INVALID
//
// MessageText:
//
//  The application attempted to enable DOS graphics mode.
//  DOS graphics mode is not supported.
//
pub const ERROR_CTX_GRAPHICS_INVALID: i32 = 7035;

//
// MessageId: ERROR_CTX_LOGON_DISABLED
//
// MessageText:
//
//  Your interactive logon privilege has been disabled.
//  Please contact your administrator.
//
pub const ERROR_CTX_LOGON_DISABLED: i32 = 7037;

//
// MessageId: ERROR_CTX_NOT_CONSOLE
//
// MessageText:
//
//  The requested operation can be performed only on the system console.
//  This is most often the result of a driver or system DLL requiring direct console access.
//
pub const ERROR_CTX_NOT_CONSOLE: i32 = 7038;

//
// MessageId: ERROR_CTX_CLIENT_QUERY_TIMEOUT
//
// MessageText:
//
//  The client failed to respond to the server connect message.
//
pub const ERROR_CTX_CLIENT_QUERY_TIMEOUT: i32 = 7040;

//
// MessageId: ERROR_CTX_CONSOLE_DISCONNECT
//
// MessageText:
//
//  Disconnecting the console session is not supported.
//
pub const ERROR_CTX_CONSOLE_DISCONNECT: i32 = 7041;

//
// MessageId: ERROR_CTX_CONSOLE_CONNECT
//
// MessageText:
//
//  Reconnecting a disconnected session to the console is not supported.
//
pub const ERROR_CTX_CONSOLE_CONNECT: i32 = 7042;

//
// MessageId: ERROR_CTX_SHADOW_DENIED
//
// MessageText:
//
//  The request to control another session remotely was denied.
//
pub const ERROR_CTX_SHADOW_DENIED: i32 = 7044;

//
// MessageId: ERROR_CTX_WINSTATION_ACCESS_DENIED
//
// MessageText:
//
//  The requested session access is denied.
//
pub const ERROR_CTX_WINSTATION_ACCESS_DENIED: i32 = 7045;

//
// MessageId: ERROR_CTX_INVALID_WD
//
// MessageText:
//
//  The specified terminal connection driver is invalid.
//
pub const ERROR_CTX_INVALID_WD: i32 = 7049;

//
// MessageId: ERROR_CTX_SHADOW_INVALID
//
// MessageText:
//
//  The requested session cannot be controlled remotely.
//  This may be because the session is disconnected or does not currently have a user logged on.
//
pub const ERROR_CTX_SHADOW_INVALID: i32 = 7050;

//
// MessageId: ERROR_CTX_SHADOW_DISABLED
//
// MessageText:
//
//  The requested session is not configured to allow remote control.
//
pub const ERROR_CTX_SHADOW_DISABLED: i32 = 7051;

//
// MessageId: ERROR_CTX_CLIENT_LICENSE_IN_USE
//
// MessageText:
//
//  Your request to connect to this Terminal Server has been rejected. Your Terminal Server client license number is currently being used by another user.
//  Please call your system administrator to obtain a unique license number.
//
pub const ERROR_CTX_CLIENT_LICENSE_IN_USE: i32 = 7052;

//
// MessageId: ERROR_CTX_CLIENT_LICENSE_NOT_SET
//
// MessageText:
//
//  Your request to connect to this Terminal Server has been rejected. Your Terminal Server client license number has not been entered for this copy of the Terminal Server client.
//  Please contact your system administrator.
//
pub const ERROR_CTX_CLIENT_LICENSE_NOT_SET: i32 = 7053;

//
// MessageId: ERROR_CTX_LICENSE_NOT_AVAILABLE
//
// MessageText:
//
//  The system has reached its licensed logon limit.
//  Please try again later.
//
pub const ERROR_CTX_LICENSE_NOT_AVAILABLE: i32 = 7054;

//
// MessageId: ERROR_CTX_LICENSE_CLIENT_INVALID
//
// MessageText:
//
//  The client you are using is not licensed to use this system.  Your logon request is denied.
//
pub const ERROR_CTX_LICENSE_CLIENT_INVALID: i32 = 7055;

//
// MessageId: ERROR_CTX_LICENSE_EXPIRED
//
// MessageText:
//
//  The system license has expired.  Your logon request is denied.
//
pub const ERROR_CTX_LICENSE_EXPIRED: i32 = 7056;

//
// MessageId: ERROR_CTX_SHADOW_NOT_RUNNING
//
// MessageText:
//
//  Remote control could not be terminated because the specified session is not currently being remotely controlled.
//
pub const ERROR_CTX_SHADOW_NOT_RUNNING: i32 = 7057;

//
// MessageId: ERROR_CTX_SHADOW_ENDED_BY_MODE_CHANGE
//
// MessageText:
//
//  The remote control of the console was terminated because the display mode was changed. Changing the display mode in a remote control session is not supported.
//
pub const ERROR_CTX_SHADOW_ENDED_BY_MODE_CHANGE: i32 = 7058;

//
// MessageId: ERROR_ACTIVATION_COUNT_EXCEEDED
//
// MessageText:
//
//  Activation has already been reset the maximum number of times for this installation. Your activation timer will not be cleared.
//
pub const ERROR_ACTIVATION_COUNT_EXCEEDED: i32 = 7059;

///////////////////////////////////////////////////
//                                                /
//             Traffic Control Error Codes        /
//                                                /
//                  7500 to  7999                 /
//                                                /
//         defined in: tcerror.h                  /
///////////////////////////////////////////////////
///////////////////////////////////////////////////
//                                                /
//             Active Directory Error Codes       /
//                                                /
//                  8000 to  8999                 /
///////////////////////////////////////////////////
// *****************
// FACILITY_FILE_REPLICATION_SERVICE
// *****************
//
// MessageId: FRS_ERR_INVALID_API_SEQUENCE
//
// MessageText:
//
//  The file replication service API was called incorrectly.
//
pub const FRS_ERR_INVALID_API_SEQUENCE: i32 = 8001;

//
// MessageId: FRS_ERR_STARTING_SERVICE
//
// MessageText:
//
//  The file replication service cannot be started.
//
pub const FRS_ERR_STARTING_SERVICE: i32 = 8002;

//
// MessageId: FRS_ERR_STOPPING_SERVICE
//
// MessageText:
//
//  The file replication service cannot be stopped.
//
pub const FRS_ERR_STOPPING_SERVICE: i32 = 8003;

//
// MessageId: FRS_ERR_INTERNAL_API
//
// MessageText:
//
//  The file replication service API terminated the request.
//  The event log may have more information.
//
pub const FRS_ERR_INTERNAL_API: i32 = 8004;

//
// MessageId: FRS_ERR_INTERNAL
//
// MessageText:
//
//  The file replication service terminated the request.
//  The event log may have more information.
//
pub const FRS_ERR_INTERNAL: i32 = 8005;

//
// MessageId: FRS_ERR_SERVICE_COMM
//
// MessageText:
//
//  The file replication service cannot be contacted.
//  The event log may have more information.
//
pub const FRS_ERR_SERVICE_COMM: i32 = 8006;

//
// MessageId: FRS_ERR_INSUFFICIENT_PRIV
//
// MessageText:
//
//  The file replication service cannot satisfy the request because the user has insufficient privileges.
//  The event log may have more information.
//
pub const FRS_ERR_INSUFFICIENT_PRIV: i32 = 8007;

//
// MessageId: FRS_ERR_AUTHENTICATION
//
// MessageText:
//
//  The file replication service cannot satisfy the request because authenticated RPC is not available.
//  The event log may have more information.
//
pub const FRS_ERR_AUTHENTICATION: i32 = 8008;

//
// MessageId: FRS_ERR_PARENT_INSUFFICIENT_PRIV
//
// MessageText:
//
//  The file replication service cannot satisfy the request because the user has insufficient privileges on the domain controller.
//  The event log may have more information.
//
pub const FRS_ERR_PARENT_INSUFFICIENT_PRIV: i32 = 8009;

//
// MessageId: FRS_ERR_PARENT_AUTHENTICATION
//
// MessageText:
//
//  The file replication service cannot satisfy the request because authenticated RPC is not available on the domain controller.
//  The event log may have more information.
//
pub const FRS_ERR_PARENT_AUTHENTICATION: i32 = 8010;

//
// MessageId: FRS_ERR_CHILD_TO_PARENT_COMM
//
// MessageText:
//
//  The file replication service cannot communicate with the file replication service on the domain controller.
//  The event log may have more information.
//
pub const FRS_ERR_CHILD_TO_PARENT_COMM: i32 = 8011;

//
// MessageId: FRS_ERR_PARENT_TO_CHILD_COMM
//
// MessageText:
//
//  The file replication service on the domain controller cannot communicate with the file replication service on this computer.
//  The event log may have more information.
//
pub const FRS_ERR_PARENT_TO_CHILD_COMM: i32 = 8012;

//
// MessageId: FRS_ERR_SYSVOL_POPULATE
//
// MessageText:
//
//  The file replication service cannot populate the system volume because of an internal error.
//  The event log may have more information.
//
pub const FRS_ERR_SYSVOL_POPULATE: i32 = 8013;

//
// MessageId: FRS_ERR_SYSVOL_POPULATE_TIMEOUT
//
// MessageText:
//
//  The file replication service cannot populate the system volume because of an internal timeout.
//  The event log may have more information.
//
pub const FRS_ERR_SYSVOL_POPULATE_TIMEOUT: i32 = 8014;

//
// MessageId: FRS_ERR_SYSVOL_IS_BUSY
//
// MessageText:
//
//  The file replication service cannot process the request. The system volume is busy with a previous request.
//
pub const FRS_ERR_SYSVOL_IS_BUSY: i32 = 8015;

//
// MessageId: FRS_ERR_SYSVOL_DEMOTE
//
// MessageText:
//
//  The file replication service cannot stop replicating the system volume because of an internal error.
//  The event log may have more information.
//
pub const FRS_ERR_SYSVOL_DEMOTE: i32 = 8016;

//
// MessageId: FRS_ERR_INVALID_SERVICE_PARAMETER
//
// MessageText:
//
//  The file replication service detected an invalid parameter.
//
pub const FRS_ERR_INVALID_SERVICE_PARAMETER: i32 = 8017;

// *****************
// FACILITY DIRECTORY SERVICE
// *****************
//
// MessageId: ERROR_DS_NOT_INSTALLED
//
// MessageText:
//
//  An error occurred while installing the directory service. For more information, see the event log.
//
pub const ERROR_DS_NOT_INSTALLED: i32 = 8200;

//
// MessageId: ERROR_DS_MEMBERSHIP_EVALUATED_LOCALLY
//
// MessageText:
//
//  The directory service evaluated group memberships locally.
//
pub const ERROR_DS_MEMBERSHIP_EVALUATED_LOCALLY: i32 = 8201;

//
// MessageId: ERROR_DS_NO_ATTRIBUTE_OR_VALUE
//
// MessageText:
//
//  The specified directory service attribute or value does not exist.
//
pub const ERROR_DS_NO_ATTRIBUTE_OR_VALUE: i32 = 8202;

//
// MessageId: ERROR_DS_INVALID_ATTRIBUTE_SYNTAX
//
// MessageText:
//
//  The attribute syntax specified to the directory service is invalid.
//
pub const ERROR_DS_INVALID_ATTRIBUTE_SYNTAX: i32 = 8203;

//
// MessageId: ERROR_DS_ATTRIBUTE_TYPE_UNDEFINED
//
// MessageText:
//
//  The attribute type specified to the directory service is not defined.
//
pub const ERROR_DS_ATTRIBUTE_TYPE_UNDEFINED: i32 = 8204;

//
// MessageId: ERROR_DS_ATTRIBUTE_OR_VALUE_EXISTS
//
// MessageText:
//
//  The specified directory service attribute or value already exists.
//
pub const ERROR_DS_ATTRIBUTE_OR_VALUE_EXISTS: i32 = 8205;

//
// MessageId: ERROR_DS_BUSY
//
// MessageText:
//
//  The directory service is busy.
//
pub const ERROR_DS_BUSY: i32 = 8206;

//
// MessageId: ERROR_DS_UNAVAILABLE
//
// MessageText:
//
//  The directory service is unavailable.
//
pub const ERROR_DS_UNAVAILABLE: i32 = 8207;

//
// MessageId: ERROR_DS_NO_RIDS_ALLOCATED
//
// MessageText:
//
//  The directory service was unable to allocate a relative identifier.
//
pub const ERROR_DS_NO_RIDS_ALLOCATED: i32 = 8208;

//
// MessageId: ERROR_DS_NO_MORE_RIDS
//
// MessageText:
//
//  The directory service has exhausted the pool of relative identifiers.
//
pub const ERROR_DS_NO_MORE_RIDS: i32 = 8209;

//
// MessageId: ERROR_DS_INCORRECT_ROLE_OWNER
//
// MessageText:
//
//  The requested operation could not be performed because the directory service is not the master for that type of operation.
//
pub const ERROR_DS_INCORRECT_ROLE_OWNER: i32 = 8210;

//
// MessageId: ERROR_DS_RIDMGR_INIT_ERROR
//
// MessageText:
//
//  The directory service was unable to initialize the subsystem that allocates relative identifiers.
//
pub const ERROR_DS_RIDMGR_INIT_ERROR: i32 = 8211;

//
// MessageId: ERROR_DS_OBJ_CLASS_VIOLATION
//
// MessageText:
//
//  The requested operation did not satisfy one or more export constraints associated with the class of the object.
//
pub const ERROR_DS_OBJ_CLASS_VIOLATION: i32 = 8212;

//
// MessageId: ERROR_DS_CANT_ON_NON_LEAF
//
// MessageText:
//
//  The directory service can perform the requested operation only on a leaf object.
//
pub const ERROR_DS_CANT_ON_NON_LEAF: i32 = 8213;

//
// MessageId: ERROR_DS_CANT_ON_RDN
//
// MessageText:
//
//  The directory service cannot perform the requested operation on the RDN attribute of an object.
//
pub const ERROR_DS_CANT_ON_RDN: i32 = 8214;

//
// MessageId: ERROR_DS_CANT_MOD_OBJ_CLASS
//
// MessageText:
//
//  The directory service detected an attempt to modify the object class of an object.
//
pub const ERROR_DS_CANT_MOD_OBJ_CLASS: i32 = 8215;

//
// MessageId: ERROR_DS_CROSS_DOM_MOVE_ERROR
//
// MessageText:
//
//  The requested cross-domain move operation could not be performed.
//
pub const ERROR_DS_CROSS_DOM_MOVE_ERROR: i32 = 8216;

//
// MessageId: ERROR_DS_GC_NOT_AVAILABLE
//
// MessageText:
//
//  Unable to contact the global catalog server.
//
pub const ERROR_DS_GC_NOT_AVAILABLE: i32 = 8217;

//
// MessageId: ERROR_SHARED_POLICY
//
// MessageText:
//
//  The policy object is shared and can only be modified at the root.
//
pub const ERROR_SHARED_POLICY: i32 = 8218;

//
// MessageId: ERROR_POLICY_OBJECT_NOT_FOUND
//
// MessageText:
//
//  The policy object does not exist.
//
pub const ERROR_POLICY_OBJECT_NOT_FOUND: i32 = 8219;

//
// MessageId: ERROR_POLICY_ONLY_IN_DS
//
// MessageText:
//
//  The requested policy information is only in the directory service.
//
pub const ERROR_POLICY_ONLY_IN_DS: i32 = 8220;

//
// MessageId: ERROR_PROMOTION_ACTIVE
//
// MessageText:
//
//  A domain controller promotion is currently active.
//
pub const ERROR_PROMOTION_ACTIVE: i32 = 8221;

//
// MessageId: ERROR_NO_PROMOTION_ACTIVE
//
// MessageText:
//
//  A domain controller promotion is not currently active
//
pub const ERROR_NO_PROMOTION_ACTIVE: i32 = 8222;

// 8223 unused
//
// MessageId: ERROR_DS_OPERATIONS_ERROR
//
// MessageText:
//
//  An operations error occurred.
//
pub const ERROR_DS_OPERATIONS_ERROR: i32 = 8224;

//
// MessageId: ERROR_DS_PROTOCOL_ERROR
//
// MessageText:
//
//  A protocol error occurred.
//
pub const ERROR_DS_PROTOCOL_ERROR: i32 = 8225;

//
// MessageId: ERROR_DS_TIMELIMIT_EXCEEDED
//
// MessageText:
//
//  The time limit for this request was exceeded.
//
pub const ERROR_DS_TIMELIMIT_EXCEEDED: i32 = 8226;

//
// MessageId: ERROR_DS_SIZELIMIT_EXCEEDED
//
// MessageText:
//
//  The size limit for this request was exceeded.
//
pub const ERROR_DS_SIZELIMIT_EXCEEDED: i32 = 8227;

//
// MessageId: ERROR_DS_ADMIN_LIMIT_EXCEEDED
//
// MessageText:
//
//  The administrative limit for this request was exceeded.
//
pub const ERROR_DS_ADMIN_LIMIT_EXCEEDED: i32 = 8228;

//
// MessageId: ERROR_DS_COMPARE_FALSE
//
// MessageText:
//
//  The compare response was false.
//
pub const ERROR_DS_COMPARE_FALSE: i32 = 8229;

//
// MessageId: ERROR_DS_COMPARE_TRUE
//
// MessageText:
//
//  The compare response was true.
//
pub const ERROR_DS_COMPARE_TRUE: i32 = 8230;

//
// MessageId: ERROR_DS_AUTH_METHOD_NOT_SUPPORTED
//
// MessageText:
//
//  The requested authentication method is not supported by the server.
//
pub const ERROR_DS_AUTH_METHOD_NOT_SUPPORTED: i32 = 8231;

//
// MessageId: ERROR_DS_STRONG_AUTH_REQUIRED
//
// MessageText:
//
//  A more secure authentication method is required for this server.
//
pub const ERROR_DS_STRONG_AUTH_REQUIRED: i32 = 8232;

//
// MessageId: ERROR_DS_INAPPROPRIATE_AUTH
//
// MessageText:
//
//  Inappropriate authentication.
//
pub const ERROR_DS_INAPPROPRIATE_AUTH: i32 = 8233;

//
// MessageId: ERROR_DS_AUTH_UNKNOWN
//
// MessageText:
//
//  The authentication mechanism is unknown.
//
pub const ERROR_DS_AUTH_UNKNOWN: i32 = 8234;

//
// MessageId: ERROR_DS_REFERRAL
//
// MessageText:
//
//  A referral was returned from the server.
//
pub const ERROR_DS_REFERRAL: i32 = 8235;

//
// MessageId: ERROR_DS_UNAVAILABLE_CRIT_EXTENSION
//
// MessageText:
//
//  The server does not support the requested critical extension.
//
pub const ERROR_DS_UNAVAILABLE_CRIT_EXTENSION: i32 = 8236;

//
// MessageId: ERROR_DS_CONFIDENTIALITY_REQUIRED
//
// MessageText:
//
//  This request requires a secure connection.
//
pub const ERROR_DS_CONFIDENTIALITY_REQUIRED: i32 = 8237;

//
// MessageId: ERROR_DS_INAPPROPRIATE_MATCHING
//
// MessageText:
//
//  Inappropriate matching.
//
pub const ERROR_DS_INAPPROPRIATE_MATCHING: i32 = 8238;

//
// MessageId: ERROR_DS_NO_SUCH_OBJECT
//
// MessageText:
//
//  There is no such object on the server.
//
pub const ERROR_DS_NO_SUCH_OBJECT: i32 = 8240;

//
// MessageId: ERROR_DS_ALIAS_PROBLEM
//
// MessageText:
//
//  There is an alias problem.
//
pub const ERROR_DS_ALIAS_PROBLEM: i32 = 8241;

//
// MessageId: ERROR_DS_INVALID_DN_SYNTAX
//
// MessageText:
//
//  An invalid dn syntax has been specified.
//
pub const ERROR_DS_INVALID_DN_SYNTAX: i32 = 8242;

//
// MessageId: ERROR_DS_IS_LEAF
//
// MessageText:
//
//  The object is a leaf object.
//
pub const ERROR_DS_IS_LEAF: i32 = 8243;

//
// MessageId: ERROR_DS_ALIAS_DEREF_PROBLEM
//
// MessageText:
//
//  There is an alias dereferencing problem.
//
pub const ERROR_DS_ALIAS_DEREF_PROBLEM: i32 = 8244;

//
// MessageId: ERROR_DS_UNWILLING_TO_PERFORM
//
// MessageText:
//
//  The server is unwilling to process the request.
//
pub const ERROR_DS_UNWILLING_TO_PERFORM: i32 = 8245;

//
// MessageId: ERROR_DS_LOOP_DETECT
//
// MessageText:
//
//  A loop has been detected.
//
pub const ERROR_DS_LOOP_DETECT: i32 = 8246;

//
// MessageId: ERROR_DS_NAMING_VIOLATION
//
// MessageText:
//
//  There is a naming violation.
//
pub const ERROR_DS_NAMING_VIOLATION: i32 = 8247;

//
// MessageId: ERROR_DS_OBJECT_RESULTS_TOO_LARGE
//
// MessageText:
//
//  The result set is too large.
//
pub const ERROR_DS_OBJECT_RESULTS_TOO_LARGE: i32 = 8248;

//
// MessageId: ERROR_DS_AFFECTS_MULTIPLE_DSAS
//
// MessageText:
//
//  The operation affects multiple DSAs
//
pub const ERROR_DS_AFFECTS_MULTIPLE_DSAS: i32 = 8249;

//
// MessageId: ERROR_DS_SERVER_DOWN
//
// MessageText:
//
//  The server is not operational.
//
pub const ERROR_DS_SERVER_DOWN: i32 = 8250;

//
// MessageId: ERROR_DS_LOCAL_ERROR
//
// MessageText:
//
//  A local error has occurred.
//
pub const ERROR_DS_LOCAL_ERROR: i32 = 8251;

//
// MessageId: ERROR_DS_ENCODING_ERROR
//
// MessageText:
//
//  An encoding error has occurred.
//
pub const ERROR_DS_ENCODING_ERROR: i32 = 8252;

//
// MessageId: ERROR_DS_DECODING_ERROR
//
// MessageText:
//
//  A decoding error has occurred.
//
pub const ERROR_DS_DECODING_ERROR: i32 = 8253;

//
// MessageId: ERROR_DS_FILTER_UNKNOWN
//
// MessageText:
//
//  The search filter cannot be recognized.
//
pub const ERROR_DS_FILTER_UNKNOWN: i32 = 8254;

//
// MessageId: ERROR_DS_PARAM_ERROR
//
// MessageText:
//
//  One or more parameters are illegal.
//
pub const ERROR_DS_PARAM_ERROR: i32 = 8255;

//
// MessageId: ERROR_DS_NOT_SUPPORTED
//
// MessageText:
//
//  The specified method is not supported.
//
pub const ERROR_DS_NOT_SUPPORTED: i32 = 8256;

//
// MessageId: ERROR_DS_NO_RESULTS_RETURNED
//
// MessageText:
//
//  No results were returned.
//
pub const ERROR_DS_NO_RESULTS_RETURNED: i32 = 8257;

//
// MessageId: ERROR_DS_CONTROL_NOT_FOUND
//
// MessageText:
//
//  The specified control is not supported by the server.
//
pub const ERROR_DS_CONTROL_NOT_FOUND: i32 = 8258;

//
// MessageId: ERROR_DS_CLIENT_LOOP
//
// MessageText:
//
//  A referral loop was detected by the client.
//
pub const ERROR_DS_CLIENT_LOOP: i32 = 8259;

//
// MessageId: ERROR_DS_REFERRAL_LIMIT_EXCEEDED
//
// MessageText:
//
//  The preset referral limit was exceeded.
//
pub const ERROR_DS_REFERRAL_LIMIT_EXCEEDED: i32 = 8260;

//
// MessageId: ERROR_DS_SORT_CONTROL_MISSING
//
// MessageText:
//
//  The search requires a SORT control.
//
pub const ERROR_DS_SORT_CONTROL_MISSING: i32 = 8261;

//
// MessageId: ERROR_DS_OFFSET_RANGE_ERROR
//
// MessageText:
//
//  The search results exceed the offset range specified.
//
pub const ERROR_DS_OFFSET_RANGE_ERROR: i32 = 8262;

//
// MessageId: ERROR_DS_ROOT_MUST_BE_NC
//
// MessageText:
//
//  The root object must be the head of a naming context. The root object cannot have an instantiated parent.
//
pub const ERROR_DS_ROOT_MUST_BE_NC: i32 = 8301;

//
// MessageId: ERROR_DS_ADD_REPLICA_INHIBITED
//
// MessageText:
//
//  The add replica operation cannot be performed. The naming context must be writeable in order to create the replica.
//
pub const ERROR_DS_ADD_REPLICA_INHIBITED: i32 = 8302;

//
// MessageId: ERROR_DS_ATT_NOT_DEF_IN_SCHEMA
//
// MessageText:
//
//  A reference to an attribute that is not defined in the schema occurred.
//
pub const ERROR_DS_ATT_NOT_DEF_IN_SCHEMA: i32 = 8303;

//
// MessageId: ERROR_DS_MAX_OBJ_SIZE_EXCEEDED
//
// MessageText:
//
//  The maximum size of an object has been exceeded.
//
pub const ERROR_DS_MAX_OBJ_SIZE_EXCEEDED: i32 = 8304;

//
// MessageId: ERROR_DS_OBJ_STRING_NAME_EXISTS
//
// MessageText:
//
//  An attempt was made to add an object to the directory with a name that is already in use.
//
pub const ERROR_DS_OBJ_STRING_NAME_EXISTS: i32 = 8305;

//
// MessageId: ERROR_DS_NO_RDN_DEFINED_IN_SCHEMA
//
// MessageText:
//
//  An attempt was made to add an object of a class that does not have an RDN defined in the schema.
//
pub const ERROR_DS_NO_RDN_DEFINED_IN_SCHEMA: i32 = 8306;

//
// MessageId: ERROR_DS_RDN_DOESNT_MATCH_SCHEMA
//
// MessageText:
//
//  An attempt was made to add an object using an RDN that is not the RDN defined in the schema.
//
pub const ERROR_DS_RDN_DOESNT_MATCH_SCHEMA: i32 = 8307;

//
// MessageId: ERROR_DS_NO_REQUESTED_ATTS_FOUND
//
// MessageText:
//
//  None of the requested attributes were found on the objects.
//
pub const ERROR_DS_NO_REQUESTED_ATTS_FOUND: i32 = 8308;

//
// MessageId: ERROR_DS_USER_BUFFER_TO_SMALL
//
// MessageText:
//
//  The user buffer is too small.
//
pub const ERROR_DS_USER_BUFFER_TO_SMALL: i32 = 8309;

//
// MessageId: ERROR_DS_ATT_IS_NOT_ON_OBJ
//
// MessageText:
//
//  The attribute specified in the operation is not present on the object.
//
pub const ERROR_DS_ATT_IS_NOT_ON_OBJ: i32 = 8310;

//
// MessageId: ERROR_DS_ILLEGAL_MOD_OPERATION
//
// MessageText:
//
//  Illegal modify operation. Some aspect of the modification is not permitted.
//
pub const ERROR_DS_ILLEGAL_MOD_OPERATION: i32 = 8311;

//
// MessageId: ERROR_DS_OBJ_TOO_LARGE
//
// MessageText:
//
//  The specified object is too large.
//
pub const ERROR_DS_OBJ_TOO_LARGE: i32 = 8312;

//
// MessageId: ERROR_DS_BAD_INSTANCE_TYPE
//
// MessageText:
//
//  The specified instance type is not valid.
//
pub const ERROR_DS_BAD_INSTANCE_TYPE: i32 = 8313;

//
// MessageId: ERROR_DS_MASTERDSA_REQUIRED
//
// MessageText:
//
//  The operation must be performed at a master DSA.
//
pub const ERROR_DS_MASTERDSA_REQUIRED: i32 = 8314;

//
// MessageId: ERROR_DS_OBJECT_CLASS_REQUIRED
//
// MessageText:
//
//  The object class attribute must be specified.
//
pub const ERROR_DS_OBJECT_CLASS_REQUIRED: i32 = 8315;

//
// MessageId: ERROR_DS_MISSING_REQUIRED_ATT
//
// MessageText:
//
//  A required attribute is missing.
//
pub const ERROR_DS_MISSING_REQUIRED_ATT: i32 = 8316;

//
// MessageId: ERROR_DS_ATT_NOT_DEF_FOR_CLASS
//
// MessageText:
//
//  An attempt was made to modify an object to include an attribute that is not legal for its class.
//
pub const ERROR_DS_ATT_NOT_DEF_FOR_CLASS: i32 = 8317;

//
// MessageId: ERROR_DS_ATT_ALREADY_EXISTS
//
// MessageText:
//
//  The specified attribute is already present on the object.
//
pub const ERROR_DS_ATT_ALREADY_EXISTS: i32 = 8318;

// 8319 unused
//
// MessageId: ERROR_DS_CANT_ADD_ATT_VALUES
//
// MessageText:
//
//  The specified attribute is not present, or has no values.
//
pub const ERROR_DS_CANT_ADD_ATT_VALUES: i32 = 8320;

//
// MessageId: ERROR_DS_ATT_VAL_ALREADY_EXISTS
//
// MessageText:
//
//  The specified value already exists.
//
pub const ERROR_DS_ATT_VAL_ALREADY_EXISTS: i32 = 8323;

//
// MessageId: ERROR_DS_CANT_REM_MISSING_ATT
//
// MessageText:
//
//  The attribute cannot be removed because it is not present on the object.
//
pub const ERROR_DS_CANT_REM_MISSING_ATT: i32 = 8324;

//
// MessageId: ERROR_DS_CANT_REM_MISSING_ATT_VAL
//
// MessageText:
//
//  The attribute value cannot be removed because it is not present on the object.
//
pub const ERROR_DS_CANT_REM_MISSING_ATT_VAL: i32 = 8325;

//
// MessageId: ERROR_DS_ROOT_CANT_BE_SUBREF
//
// MessageText:
//
//  The specified root object cannot be a subref.
//
pub const ERROR_DS_ROOT_CANT_BE_SUBREF: i32 = 8326;

//
// MessageId: ERROR_DS_NO_CHAINING
//
// MessageText:
//
//  Chaining is not permitted.
//
pub const ERROR_DS_NO_CHAINING: i32 = 8327;

//
// MessageId: ERROR_DS_NO_CHAINED_EVAL
//
// MessageText:
//
//  Chained evaluation is not permitted.
//
pub const ERROR_DS_NO_CHAINED_EVAL: i32 = 8328;

//
// MessageId: ERROR_DS_NO_PARENT_OBJECT
//
// MessageText:
//
//  The operation could not be performed because the object's parent is either uninstantiated or deleted.
//
pub const ERROR_DS_NO_PARENT_OBJECT: i32 = 8329;

//
// MessageId: ERROR_DS_PARENT_IS_AN_ALIAS
//
// MessageText:
//
//  Having a parent that is an alias is not permitted. Aliases are leaf objects.
//
pub const ERROR_DS_PARENT_IS_AN_ALIAS: i32 = 8330;

//
// MessageId: ERROR_DS_CANT_MIX_MASTER_AND_REPS
//
// MessageText:
//
//  The object and parent must be of the same type, either both masters or both replicas.
//
pub const ERROR_DS_CANT_MIX_MASTER_AND_REPS: i32 = 8331;

//
// MessageId: ERROR_DS_CHILDREN_EXIST
//
// MessageText:
//
//  The operation cannot be performed because child objects exist. This operation can only be performed on a leaf object.
//
pub const ERROR_DS_CHILDREN_EXIST: i32 = 8332;

//
// MessageId: ERROR_DS_OBJ_NOT_FOUND
//
// MessageText:
//
//  Directory object not found.
//
pub const ERROR_DS_OBJ_NOT_FOUND: i32 = 8333;

//
// MessageId: ERROR_DS_ALIASED_OBJ_MISSING
//
// MessageText:
//
//  The aliased object is missing.
//
pub const ERROR_DS_ALIASED_OBJ_MISSING: i32 = 8334;

//
// MessageId: ERROR_DS_BAD_NAME_SYNTAX
//
// MessageText:
//
//  The object name has bad syntax.
//
pub const ERROR_DS_BAD_NAME_SYNTAX: i32 = 8335;

//
// MessageId: ERROR_DS_ALIAS_POINTS_TO_ALIAS
//
// MessageText:
//
//  It is not permitted for an alias to refer to another alias.
//
pub const ERROR_DS_ALIAS_POINTS_TO_ALIAS: i32 = 8336;

//
// MessageId: ERROR_DS_CANT_DEREF_ALIAS
//
// MessageText:
//
//  The alias cannot be dereferenced.
//
pub const ERROR_DS_CANT_DEREF_ALIAS: i32 = 8337;

//
// MessageId: ERROR_DS_OUT_OF_SCOPE
//
// MessageText:
//
//  The operation is out of scope.
//
pub const ERROR_DS_OUT_OF_SCOPE: i32 = 8338;

//
// MessageId: ERROR_DS_OBJECT_BEING_REMOVED
//
// MessageText:
//
//  The operation cannot continue because the object is in the process of being removed.
//
pub const ERROR_DS_OBJECT_BEING_REMOVED: i32 = 8339;

//
// MessageId: ERROR_DS_CANT_DELETE_DSA_OBJ
//
// MessageText:
//
//  The DSA object cannot be deleted.
//
pub const ERROR_DS_CANT_DELETE_DSA_OBJ: i32 = 8340;

//
// MessageId: ERROR_DS_GENERIC_ERROR
//
// MessageText:
//
//  A directory service error has occurred.
//
pub const ERROR_DS_GENERIC_ERROR: i32 = 8341;

//
// MessageId: ERROR_DS_DSA_MUST_BE_INT_MASTER
//
// MessageText:
//
//  The operation can only be performed on an internal master DSA object.
//
pub const ERROR_DS_DSA_MUST_BE_INT_MASTER: i32 = 8342;

//
// MessageId: ERROR_DS_CLASS_NOT_DSA
//
// MessageText:
//
//  The object must be of class DSA.
//
pub const ERROR_DS_CLASS_NOT_DSA: i32 = 8343;

//
// MessageId: ERROR_DS_INSUFF_ACCESS_RIGHTS
//
// MessageText:
//
//  Insufficient access rights to perform the operation.
//
pub const ERROR_DS_INSUFF_ACCESS_RIGHTS: i32 = 8344;

//
// MessageId: ERROR_DS_ILLEGAL_SUPERIOR
//
// MessageText:
//
//  The object cannot be added because the parent is not on the list of possible superiors.
//
pub const ERROR_DS_ILLEGAL_SUPERIOR: i32 = 8345;

//
// MessageId: ERROR_DS_ATTRIBUTE_OWNED_BY_SAM
//
// MessageText:
//
//  Access to the attribute is not permitted because the attribute is owned by the Security Accounts Manager (SAM).
//
pub const ERROR_DS_ATTRIBUTE_OWNED_BY_SAM: i32 = 8346;

//
// MessageId: ERROR_DS_NAME_TOO_MANY_PARTS
//
// MessageText:
//
//  The name has too many parts.
//
pub const ERROR_DS_NAME_TOO_MANY_PARTS: i32 = 8347;

//
// MessageId: ERROR_DS_NAME_TOO_LONG
//
// MessageText:
//
//  The name is too long.
//
pub const ERROR_DS_NAME_TOO_LONG: i32 = 8348;

//
// MessageId: ERROR_DS_NAME_VALUE_TOO_LONG
//
// MessageText:
//
//  The name value is too long.
//
pub const ERROR_DS_NAME_VALUE_TOO_LONG: i32 = 8349;

//
// MessageId: ERROR_DS_NAME_UNPARSEABLE
//
// MessageText:
//
//  The directory service encountered an error parsing a name.
//
pub const ERROR_DS_NAME_UNPARSEABLE: i32 = 8350;

//
// MessageId: ERROR_DS_NAME_TYPE_UNKNOWN
//
// MessageText:
//
//  The directory service cannot get the attribute type for a name.
//
pub const ERROR_DS_NAME_TYPE_UNKNOWN: i32 = 8351;

//
// MessageId: ERROR_DS_NOT_AN_OBJECT
//
// MessageText:
//
//  The name does not identify an object; the name identifies a phantom.
//
pub const ERROR_DS_NOT_AN_OBJECT: i32 = 8352;

//
// MessageId: ERROR_DS_SEC_DESC_TOO_SHORT
//
// MessageText:
//
//  The security descriptor is too short.
//
pub const ERROR_DS_SEC_DESC_TOO_SHORT: i32 = 8353;

//
// MessageId: ERROR_DS_SEC_DESC_INVALID
//
// MessageText:
//
//  The security descriptor is invalid.
//
pub const ERROR_DS_SEC_DESC_INVALID: i32 = 8354;

//
// MessageId: ERROR_DS_NO_DELETED_NAME
//
// MessageText:
//
//  Failed to create name for deleted object.
//
pub const ERROR_DS_NO_DELETED_NAME: i32 = 8355;

//
// MessageId: ERROR_DS_SUBREF_MUST_HAVE_PARENT
//
// MessageText:
//
//  The parent of a new subref must exist.
//
pub const ERROR_DS_SUBREF_MUST_HAVE_PARENT: i32 = 8356;

//
// MessageId: ERROR_DS_NCNAME_MUST_BE_NC
//
// MessageText:
//
//  The object must be a naming context.
//
pub const ERROR_DS_NCNAME_MUST_BE_NC: i32 = 8357;

//
// MessageId: ERROR_DS_CANT_ADD_SYSTEM_ONLY
//
// MessageText:
//
//  It is not permitted to add an attribute which is owned by the system.
//
pub const ERROR_DS_CANT_ADD_SYSTEM_ONLY: i32 = 8358;

//
// MessageId: ERROR_DS_CLASS_MUST_BE_CONCRETE
//
// MessageText:
//
//  The class of the object must be structural; you cannot instantiate an abstract class.
//
pub const ERROR_DS_CLASS_MUST_BE_CONCRETE: i32 = 8359;

//
// MessageId: ERROR_DS_INVALID_DMD
//
// MessageText:
//
//  The schema object could not be found.
//
pub const ERROR_DS_INVALID_DMD: i32 = 8360;

//
// MessageId: ERROR_DS_OBJ_GUID_EXISTS
//
// MessageText:
//
//  A local object with this GUID (dead or alive) already exists.
//
pub const ERROR_DS_OBJ_GUID_EXISTS: i32 = 8361;

//
// MessageId: ERROR_DS_NOT_ON_BACKLINK
//
// MessageText:
//
//  The operation cannot be performed on a back link.
//
pub const ERROR_DS_NOT_ON_BACKLINK: i32 = 8362;

//
// MessageId: ERROR_DS_NO_CROSSREF_FOR_NC
//
// MessageText:
//
//  The cross reference for the specified naming context could not be found.
//
pub const ERROR_DS_NO_CROSSREF_FOR_NC: i32 = 8363;

//
// MessageId: ERROR_DS_SHUTTING_DOWN
//
// MessageText:
//
//  The operation could not be performed because the directory service is shutting down.
//
pub const ERROR_DS_SHUTTING_DOWN: i32 = 8364;

//
// MessageId: ERROR_DS_UNKNOWN_OPERATION
//
// MessageText:
//
//  The directory service request is invalid.
//
pub const ERROR_DS_UNKNOWN_OPERATION: i32 = 8365;

//
// MessageId: ERROR_DS_INVALID_ROLE_OWNER
//
// MessageText:
//
//  The role owner attribute could not be read.
//
pub const ERROR_DS_INVALID_ROLE_OWNER: i32 = 8366;

//
// MessageId: ERROR_DS_COULDNT_CONTACT_FSMO
//
// MessageText:
//
//  The requested FSMO operation failed. The current FSMO holder could not be contacted.
//
pub const ERROR_DS_COULDNT_CONTACT_FSMO: i32 = 8367;

//
// MessageId: ERROR_DS_CROSS_NC_DN_RENAME
//
// MessageText:
//
//  Modification of a DN across a naming context is not permitted.
//
pub const ERROR_DS_CROSS_NC_DN_RENAME: i32 = 8368;

//
// MessageId: ERROR_DS_CANT_MOD_SYSTEM_ONLY
//
// MessageText:
//
//  The attribute cannot be modified because it is owned by the system.
//
pub const ERROR_DS_CANT_MOD_SYSTEM_ONLY: i32 = 8369;

//
// MessageId: ERROR_DS_REPLICATOR_ONLY
//
// MessageText:
//
//  Only the replicator can perform this function.
//
pub const ERROR_DS_REPLICATOR_ONLY: i32 = 8370;

//
// MessageId: ERROR_DS_OBJ_CLASS_NOT_DEFINED
//
// MessageText:
//
//  The specified class is not defined.
//
pub const ERROR_DS_OBJ_CLASS_NOT_DEFINED: i32 = 8371;

//
// MessageId: ERROR_DS_OBJ_CLASS_NOT_SUBCLASS
//
// MessageText:
//
//  The specified class is not a subclass.
//
pub const ERROR_DS_OBJ_CLASS_NOT_SUBCLASS: i32 = 8372;

//
// MessageId: ERROR_DS_NAME_REFERENCE_INVALID
//
// MessageText:
//
//  The name reference is invalid.
//
pub const ERROR_DS_NAME_REFERENCE_INVALID: i32 = 8373;

//
// MessageId: ERROR_DS_CROSS_REF_EXISTS
//
// MessageText:
//
//  A cross reference already exists.
//
pub const ERROR_DS_CROSS_REF_EXISTS: i32 = 8374;

//
// MessageId: ERROR_DS_CANT_DEL_MASTER_CROSSREF
//
// MessageText:
//
//  It is not permitted to delete a master cross reference.
//
pub const ERROR_DS_CANT_DEL_MASTER_CROSSREF: i32 = 8375;

//
// MessageId: ERROR_DS_SUBTREE_NOTIFY_NOT_NC_HEAD
//
// MessageText:
//
//  Subtree notifications are only supported on NC heads.
//
pub const ERROR_DS_SUBTREE_NOTIFY_NOT_NC_HEAD: i32 = 8376;

//
// MessageId: ERROR_DS_NOTIFY_FILTER_TOO_COMPLEX
//
// MessageText:
//
//  Notification filter is too complex.
//
pub const ERROR_DS_NOTIFY_FILTER_TOO_COMPLEX: i32 = 8377;

//
// MessageId: ERROR_DS_DUP_RDN
//
// MessageText:
//
//  Schema update failed: duplicate RDN.
//
pub const ERROR_DS_DUP_RDN: i32 = 8378;

//
// MessageId: ERROR_DS_DUP_OID
//
// MessageText:
//
//  Schema update failed: duplicate OID.
//
pub const ERROR_DS_DUP_OID: i32 = 8379;

//
// MessageId: ERROR_DS_DUP_MAPI_ID
//
// MessageText:
//
//  Schema update failed: duplicate MAPI identifier.
//
pub const ERROR_DS_DUP_MAPI_ID: i32 = 8380;

//
// MessageId: ERROR_DS_DUP_SCHEMA_ID_GUID
//
// MessageText:
//
//  Schema update failed: duplicate schema-id GUID.
//
pub const ERROR_DS_DUP_SCHEMA_ID_GUID: i32 = 8381;

//
// MessageId: ERROR_DS_DUP_LDAP_DISPLAY_NAME
//
// MessageText:
//
//  Schema update failed: duplicate LDAP display name.
//
pub const ERROR_DS_DUP_LDAP_DISPLAY_NAME: i32 = 8382;

//
// MessageId: ERROR_DS_SEMANTIC_ATT_TEST
//
// MessageText:
//
//  Schema update failed: range-lower less than range upper.
//
pub const ERROR_DS_SEMANTIC_ATT_TEST: i32 = 8383;

//
// MessageId: ERROR_DS_SYNTAX_MISMATCH
//
// MessageText:
//
//  Schema update failed: syntax mismatch.
//
pub const ERROR_DS_SYNTAX_MISMATCH: i32 = 8384;

//
// MessageId: ERROR_DS_EXISTS_IN_MUST_HAVE
//
// MessageText:
//
//  Schema deletion failed: attribute is used in must-contain.
//
pub const ERROR_DS_EXISTS_IN_MUST_HAVE: i32 = 8385;

//
// MessageId: ERROR_DS_EXISTS_IN_MAY_HAVE
//
// MessageText:
//
//  Schema deletion failed: attribute is used in may-contain.
//
pub const ERROR_DS_EXISTS_IN_MAY_HAVE: i32 = 8386;

//
// MessageId: ERROR_DS_NONEXISTENT_MAY_HAVE
//
// MessageText:
//
//  Schema update failed: attribute in may-contain does not exist.
//
pub const ERROR_DS_NONEXISTENT_MAY_HAVE: i32 = 8387;

//
// MessageId: ERROR_DS_NONEXISTENT_MUST_HAVE
//
// MessageText:
//
//  Schema update failed: attribute in must-contain does not exist.
//
pub const ERROR_DS_NONEXISTENT_MUST_HAVE: i32 = 8388;

//
// MessageId: ERROR_DS_AUX_CLS_TEST_FAIL
//
// MessageText:
//
//  Schema update failed: class in aux-class list does not exist or is not an auxiliary class.
//
pub const ERROR_DS_AUX_CLS_TEST_FAIL: i32 = 8389;

//
// MessageId: ERROR_DS_NONEXISTENT_POSS_SUP
//
// MessageText:
//
//  Schema update failed: class in poss-superiors does not exist.
//
pub const ERROR_DS_NONEXISTENT_POSS_SUP: i32 = 8390;

//
// MessageId: ERROR_DS_SUB_CLS_TEST_FAIL
//
// MessageText:
//
//  Schema update failed: class in subclassof list does not exist or does not satisfy hierarchy rules.
//
pub const ERROR_DS_SUB_CLS_TEST_FAIL: i32 = 8391;

//
// MessageId: ERROR_DS_BAD_RDN_ATT_ID_SYNTAX
//
// MessageText:
//
//  Schema update failed: Rdn-Att-Id has wrong syntax.
//
pub const ERROR_DS_BAD_RDN_ATT_ID_SYNTAX: i32 = 8392;

//
// MessageId: ERROR_DS_EXISTS_IN_AUX_CLS
//
// MessageText:
//
//  Schema deletion failed: class is used as auxiliary class.
//
pub const ERROR_DS_EXISTS_IN_AUX_CLS: i32 = 8393;

//
// MessageId: ERROR_DS_EXISTS_IN_SUB_CLS
//
// MessageText:
//
//  Schema deletion failed: class is used as sub class.
//
pub const ERROR_DS_EXISTS_IN_SUB_CLS: i32 = 8394;

//
// MessageId: ERROR_DS_EXISTS_IN_POSS_SUP
//
// MessageText:
//
//  Schema deletion failed: class is used as poss-superior.
//
pub const ERROR_DS_EXISTS_IN_POSS_SUP: i32 = 8395;

//
// MessageId: ERROR_DS_RECALCSCHEMA_FAILED
//
// MessageText:
//
//  Schema update failed in recalculating validation cache.
//
pub const ERROR_DS_RECALCSCHEMA_FAILED: i32 = 8396;

//
// MessageId: ERROR_DS_TREE_DELETE_NOT_FINISHED
//
// MessageText:
//
//  The tree deletion is not finished.  The request must be made again to continue deleting the tree.
//
pub const ERROR_DS_TREE_DELETE_NOT_FINISHED: i32 = 8397;

//
// MessageId: ERROR_DS_CANT_DELETE
//
// MessageText:
//
//  The requested delete operation could not be performed.
//
pub const ERROR_DS_CANT_DELETE: i32 = 8398;

//
// MessageId: ERROR_DS_ATT_SCHEMA_REQ_ID
//
// MessageText:
//
//  Cannot read the governs class identifier for the schema record.
//
pub const ERROR_DS_ATT_SCHEMA_REQ_ID: i32 = 8399;

//
// MessageId: ERROR_DS_BAD_ATT_SCHEMA_SYNTAX
//
// MessageText:
//
//  The attribute schema has bad syntax.
//
pub const ERROR_DS_BAD_ATT_SCHEMA_SYNTAX: i32 = 8400;

//
// MessageId: ERROR_DS_CANT_CACHE_ATT
//
// MessageText:
//
//  The attribute could not be cached.
//
pub const ERROR_DS_CANT_CACHE_ATT: i32 = 8401;

//
// MessageId: ERROR_DS_CANT_CACHE_CLASS
//
// MessageText:
//
//  The class could not be cached.
//
pub const ERROR_DS_CANT_CACHE_CLASS: i32 = 8402;

//
// MessageId: ERROR_DS_CANT_REMOVE_ATT_CACHE
//
// MessageText:
//
//  The attribute could not be removed from the cache.
//
pub const ERROR_DS_CANT_REMOVE_ATT_CACHE: i32 = 8403;

//
// MessageId: ERROR_DS_CANT_REMOVE_CLASS_CACHE
//
// MessageText:
//
//  The class could not be removed from the cache.
//
pub const ERROR_DS_CANT_REMOVE_CLASS_CACHE: i32 = 8404;

//
// MessageId: ERROR_DS_CANT_RETRIEVE_DN
//
// MessageText:
//
//  The distinguished name attribute could not be read.
//
pub const ERROR_DS_CANT_RETRIEVE_DN: i32 = 8405;

//
// MessageId: ERROR_DS_MISSING_SUPREF
//
// MessageText:
//
//  No superior reference has been configured for the directory service. The directory service is therefore unable to issue referrals to objects outside this forest.
//
pub const ERROR_DS_MISSING_SUPREF: i32 = 8406;

//
// MessageId: ERROR_DS_CANT_RETRIEVE_INSTANCE
//
// MessageText:
//
//  The instance type attribute could not be retrieved.
//
pub const ERROR_DS_CANT_RETRIEVE_INSTANCE: i32 = 8407;

//
// MessageId: ERROR_DS_CODE_INCONSISTENCY
//
// MessageText:
//
//  An internal error has occurred.
//
pub const ERROR_DS_CODE_INCONSISTENCY: i32 = 8408;

//
// MessageId: ERROR_DS_DATABASE_ERROR
//
// MessageText:
//
//  A database error has occurred.
//
pub const ERROR_DS_DATABASE_ERROR: i32 = 8409;

//
// MessageId: ERROR_DS_GOVERNSID_MISSING
//
// MessageText:
//
//  The attribute GOVERNSID is missing.
//
pub const ERROR_DS_GOVERNSID_MISSING: i32 = 8410;

//
// MessageId: ERROR_DS_MISSING_EXPECTED_ATT
//
// MessageText:
//
//  An expected attribute is missing.
//
pub const ERROR_DS_MISSING_EXPECTED_ATT: i32 = 8411;

//
// MessageId: ERROR_DS_NCNAME_MISSING_CR_REF
//
// MessageText:
//
//  The specified naming context is missing a cross reference.
//
pub const ERROR_DS_NCNAME_MISSING_CR_REF: i32 = 8412;

//
// MessageId: ERROR_DS_SECURITY_CHECKING_ERROR
//
// MessageText:
//
//  A security checking error has occurred.
//
pub const ERROR_DS_SECURITY_CHECKING_ERROR: i32 = 8413;

//
// MessageId: ERROR_DS_SCHEMA_NOT_LOADED
//
// MessageText:
//
//  The schema is not loaded.
//
pub const ERROR_DS_SCHEMA_NOT_LOADED: i32 = 8414;

//
// MessageId: ERROR_DS_SCHEMA_ALLOC_FAILED
//
// MessageText:
//
//  Schema allocation failed. Please check if the machine is running low on memory.
//
pub const ERROR_DS_SCHEMA_ALLOC_FAILED: i32 = 8415;

//
// MessageId: ERROR_DS_ATT_SCHEMA_REQ_SYNTAX
//
// MessageText:
//
//  Failed to obtain the required syntax for the attribute schema.
//
pub const ERROR_DS_ATT_SCHEMA_REQ_SYNTAX: i32 = 8416;

//
// MessageId: ERROR_DS_GCVERIFY_ERROR
//
// MessageText:
//
//  The global catalog verification failed. The global catalog is not available or does not support the operation. Some part of the directory is currently not available.
//
pub const ERROR_DS_GCVERIFY_ERROR: i32 = 8417;

//
// MessageId: ERROR_DS_DRA_SCHEMA_MISMATCH
//
// MessageText:
//
//  The replication operation failed because of a schema mismatch between the servers involved.
//
pub const ERROR_DS_DRA_SCHEMA_MISMATCH: i32 = 8418;

//
// MessageId: ERROR_DS_CANT_FIND_DSA_OBJ
//
// MessageText:
//
//  The DSA object could not be found.
//
pub const ERROR_DS_CANT_FIND_DSA_OBJ: i32 = 8419;

//
// MessageId: ERROR_DS_CANT_FIND_EXPECTED_NC
//
// MessageText:
//
//  The naming context could not be found.
//
pub const ERROR_DS_CANT_FIND_EXPECTED_NC: i32 = 8420;

//
// MessageId: ERROR_DS_CANT_FIND_NC_IN_CACHE
//
// MessageText:
//
//  The naming context could not be found in the cache.
//
pub const ERROR_DS_CANT_FIND_NC_IN_CACHE: i32 = 8421;

//
// MessageId: ERROR_DS_CANT_RETRIEVE_CHILD
//
// MessageText:
//
//  The child object could not be retrieved.
//
pub const ERROR_DS_CANT_RETRIEVE_CHILD: i32 = 8422;

//
// MessageId: ERROR_DS_SECURITY_ILLEGAL_MODIFY
//
// MessageText:
//
//  The modification was not permitted for security reasons.
//
pub const ERROR_DS_SECURITY_ILLEGAL_MODIFY: i32 = 8423;

//
// MessageId: ERROR_DS_CANT_REPLACE_HIDDEN_REC
//
// MessageText:
//
//  The operation cannot replace the hidden record.
//
pub const ERROR_DS_CANT_REPLACE_HIDDEN_REC: i32 = 8424;

//
// MessageId: ERROR_DS_BAD_HIERARCHY_FILE
//
// MessageText:
//
//  The hierarchy file is invalid.
//
pub const ERROR_DS_BAD_HIERARCHY_FILE: i32 = 8425;

//
// MessageId: ERROR_DS_BUILD_HIERARCHY_TABLE_FAILED
//
// MessageText:
//
//  The attempt to build the hierarchy table failed.
//
pub const ERROR_DS_BUILD_HIERARCHY_TABLE_FAILED: i32 = 8426;

//
// MessageId: ERROR_DS_CONFIG_PARAM_MISSING
//
// MessageText:
//
//  The directory configuration parameter is missing from the registry.
//
pub const ERROR_DS_CONFIG_PARAM_MISSING: i32 = 8427;

//
// MessageId: ERROR_DS_COUNTING_AB_INDICES_FAILED
//
// MessageText:
//
//  The attempt to count the address book indices failed.
//
pub const ERROR_DS_COUNTING_AB_INDICES_FAILED: i32 = 8428;

//
// MessageId: ERROR_DS_HIERARCHY_TABLE_MALLOC_FAILED
//
// MessageText:
//
//  The allocation of the hierarchy table failed.
//
pub const ERROR_DS_HIERARCHY_TABLE_MALLOC_FAILED: i32 = 8429;

//
// MessageId: ERROR_DS_INTERNAL_FAILURE
//
// MessageText:
//
//  The directory service encountered an internal failure.
//
pub const ERROR_DS_INTERNAL_FAILURE: i32 = 8430;

//
// MessageId: ERROR_DS_UNKNOWN_ERROR
//
// MessageText:
//
//  The directory service encountered an unknown failure.
//
pub const ERROR_DS_UNKNOWN_ERROR: i32 = 8431;

//
// MessageId: ERROR_DS_ROOT_REQUIRES_CLASS_TOP
//
// MessageText:
//
//  A root object requires a class of 'top'.
//
pub const ERROR_DS_ROOT_REQUIRES_CLASS_TOP: i32 = 8432;

//
// MessageId: ERROR_DS_REFUSING_FSMO_ROLES
//
// MessageText:
//
//  This directory server is shutting down, and cannot take ownership of new floating single-master operation roles.
//
pub const ERROR_DS_REFUSING_FSMO_ROLES: i32 = 8433;

//
// MessageId: ERROR_DS_MISSING_FSMO_SETTINGS
//
// MessageText:
//
//  The directory service is missing mandatory configuration information, and is unable to determine the ownership of floating single-master operation roles.
//
pub const ERROR_DS_MISSING_FSMO_SETTINGS: i32 = 8434;

//
// MessageId: ERROR_DS_UNABLE_TO_SURRENDER_ROLES
//
// MessageText:
//
//  The directory service was unable to transfer ownership of one or more floating single-master operation roles to other servers.
//
pub const ERROR_DS_UNABLE_TO_SURRENDER_ROLES: i32 = 8435;

//
// MessageId: ERROR_DS_DRA_GENERIC
//
// MessageText:
//
//  The replication operation failed.
//
pub const ERROR_DS_DRA_GENERIC: i32 = 8436;

//
// MessageId: ERROR_DS_DRA_INVALID_PARAMETER
//
// MessageText:
//
//  An invalid parameter was specified for this replication operation.
//
pub const ERROR_DS_DRA_INVALID_PARAMETER: i32 = 8437;

//
// MessageId: ERROR_DS_DRA_BUSY
//
// MessageText:
//
//  The directory service is too busy to complete the replication operation at this time.
//
pub const ERROR_DS_DRA_BUSY: i32 = 8438;

//
// MessageId: ERROR_DS_DRA_BAD_DN
//
// MessageText:
//
//  The distinguished name specified for this replication operation is invalid.
//
pub const ERROR_DS_DRA_BAD_DN: i32 = 8439;

//
// MessageId: ERROR_DS_DRA_BAD_NC
//
// MessageText:
//
//  The naming context specified for this replication operation is invalid.
//
pub const ERROR_DS_DRA_BAD_NC: i32 = 8440;

//
// MessageId: ERROR_DS_DRA_DN_EXISTS
//
// MessageText:
//
//  The distinguished name specified for this replication operation already exists.
//
pub const ERROR_DS_DRA_DN_EXISTS: i32 = 8441;

//
// MessageId: ERROR_DS_DRA_INTERNAL_ERROR
//
// MessageText:
//
//  The replication system encountered an internal error.
//
pub const ERROR_DS_DRA_INTERNAL_ERROR: i32 = 8442;

//
// MessageId: ERROR_DS_DRA_INCONSISTENT_DIT
//
// MessageText:
//
//  The replication operation encountered a database inconsistency.
//
pub const ERROR_DS_DRA_INCONSISTENT_DIT: i32 = 8443;

//
// MessageId: ERROR_DS_DRA_CONNECTION_FAILED
//
// MessageText:
//
//  The server specified for this replication operation could not be contacted.
//
pub const ERROR_DS_DRA_CONNECTION_FAILED: i32 = 8444;

//
// MessageId: ERROR_DS_DRA_BAD_INSTANCE_TYPE
//
// MessageText:
//
//  The replication operation encountered an object with an invalid instance type.
//
pub const ERROR_DS_DRA_BAD_INSTANCE_TYPE: i32 = 8445;

//
// MessageId: ERROR_DS_DRA_OUT_OF_MEM
//
// MessageText:
//
//  The replication operation failed to allocate memory.
//
pub const ERROR_DS_DRA_OUT_OF_MEM: i32 = 8446;

//
// MessageId: ERROR_DS_DRA_MAIL_PROBLEM
//
// MessageText:
//
//  The replication operation encountered an error with the mail system.
//
pub const ERROR_DS_DRA_MAIL_PROBLEM: i32 = 8447;

//
// MessageId: ERROR_DS_DRA_REF_ALREADY_EXISTS
//
// MessageText:
//
//  The replication reference information for the target server already exists.
//
pub const ERROR_DS_DRA_REF_ALREADY_EXISTS: i32 = 8448;

//
// MessageId: ERROR_DS_DRA_REF_NOT_FOUND
//
// MessageText:
//
//  The replication reference information for the target server does not exist.
//
pub const ERROR_DS_DRA_REF_NOT_FOUND: i32 = 8449;

//
// MessageId: ERROR_DS_DRA_OBJ_IS_REP_SOURCE
//
// MessageText:
//
//  The naming context cannot be removed because it is replicated to another server.
//
pub const ERROR_DS_DRA_OBJ_IS_REP_SOURCE: i32 = 8450;

//
// MessageId: ERROR_DS_DRA_DB_ERROR
//
// MessageText:
//
//  The replication operation encountered a database error.
//
pub const ERROR_DS_DRA_DB_ERROR: i32 = 8451;

//
// MessageId: ERROR_DS_DRA_NO_REPLICA
//
// MessageText:
//
//  The naming context is in the process of being removed or is not replicated from the specified server.
//
pub const ERROR_DS_DRA_NO_REPLICA: i32 = 8452;

//
// MessageId: ERROR_DS_DRA_ACCESS_DENIED
//
// MessageText:
//
//  Replication access was denied.
//
pub const ERROR_DS_DRA_ACCESS_DENIED: i32 = 8453;

//
// MessageId: ERROR_DS_DRA_NOT_SUPPORTED
//
// MessageText:
//
//  The requested operation is not supported by this version of the directory service.
//
pub const ERROR_DS_DRA_NOT_SUPPORTED: i32 = 8454;

//
// MessageId: ERROR_DS_DRA_RPC_CANCELLED
//
// MessageText:
//
//  The replication remote procedure call was cancelled.
//
pub const ERROR_DS_DRA_RPC_CANCELLED: i32 = 8455;

//
// MessageId: ERROR_DS_DRA_SOURCE_DISABLED
//
// MessageText:
//
//  The source server is currently rejecting replication requests.
//
pub const ERROR_DS_DRA_SOURCE_DISABLED: i32 = 8456;

//
// MessageId: ERROR_DS_DRA_SINK_DISABLED
//
// MessageText:
//
//  The destination server is currently rejecting replication requests.
//
pub const ERROR_DS_DRA_SINK_DISABLED: i32 = 8457;

//
// MessageId: ERROR_DS_DRA_NAME_COLLISION
//
// MessageText:
//
//  The replication operation failed due to a collision of object names.
//
pub const ERROR_DS_DRA_NAME_COLLISION: i32 = 8458;

//
// MessageId: ERROR_DS_DRA_SOURCE_REINSTALLED
//
// MessageText:
//
//  The replication source has been reinstalled.
//
pub const ERROR_DS_DRA_SOURCE_REINSTALLED: i32 = 8459;

//
// MessageId: ERROR_DS_DRA_MISSING_PARENT
//
// MessageText:
//
//  The replication operation failed because a required parent object is missing.
//
pub const ERROR_DS_DRA_MISSING_PARENT: i32 = 8460;

//
// MessageId: ERROR_DS_DRA_PREEMPTED
//
// MessageText:
//
//  The replication operation was preempted.
//
pub const ERROR_DS_DRA_PREEMPTED: i32 = 8461;

//
// MessageId: ERROR_DS_DRA_ABANDON_SYNC
//
// MessageText:
//
//  The replication synchronization attempt was abandoned because of a lack of updates.
//
pub const ERROR_DS_DRA_ABANDON_SYNC: i32 = 8462;

//
// MessageId: ERROR_DS_DRA_SHUTDOWN
//
// MessageText:
//
//  The replication operation was terminated because the system is shutting down.
//
pub const ERROR_DS_DRA_SHUTDOWN: i32 = 8463;

//
// MessageId: ERROR_DS_DRA_INCOMPATIBLE_PARTIAL_SET
//
// MessageText:
//
//  Synchronization attempt failed because the destination DC is currently waiting to synchronize new partial attributes from source. This condition is normal if a recent schema change modified the partial attribute set. The destination partial attribute set is not a subset of source partial attribute set.
//
pub const ERROR_DS_DRA_INCOMPATIBLE_PARTIAL_SET: i32 = 8464;

//
// MessageId: ERROR_DS_DRA_SOURCE_IS_PARTIAL_REPLICA
//
// MessageText:
//
//  The replication synchronization attempt failed because a master replica attempted to sync from a partial replica.
//
pub const ERROR_DS_DRA_SOURCE_IS_PARTIAL_REPLICA: i32 = 8465;

//
// MessageId: ERROR_DS_DRA_EXTN_CONNECTION_FAILED
//
// MessageText:
//
//  The server specified for this replication operation was contacted, but that server was unable to contact an additional server needed to complete the operation.
//
pub const ERROR_DS_DRA_EXTN_CONNECTION_FAILED: i32 = 8466;

//
// MessageId: ERROR_DS_INSTALL_SCHEMA_MISMATCH
//
// MessageText:
//
//  The version of the Active Directory schema of the source forest is not compatible with the version of Active Directory on this computer.
//
pub const ERROR_DS_INSTALL_SCHEMA_MISMATCH: i32 = 8467;

//
// MessageId: ERROR_DS_DUP_LINK_ID
//
// MessageText:
//
//  Schema update failed: An attribute with the same link identifier already exists.
//
pub const ERROR_DS_DUP_LINK_ID: i32 = 8468;

//
// MessageId: ERROR_DS_NAME_ERROR_RESOLVING
//
// MessageText:
//
//  Name translation: Generic processing error.
//
pub const ERROR_DS_NAME_ERROR_RESOLVING: i32 = 8469;

//
// MessageId: ERROR_DS_NAME_ERROR_NOT_FOUND
//
// MessageText:
//
//  Name translation: Could not find the name or insufficient right to see name.
//
pub const ERROR_DS_NAME_ERROR_NOT_FOUND: i32 = 8470;

//
// MessageId: ERROR_DS_NAME_ERROR_NOT_UNIQUE
//
// MessageText:
//
//  Name translation: Input name mapped to more than one output name.
//
pub const ERROR_DS_NAME_ERROR_NOT_UNIQUE: i32 = 8471;

//
// MessageId: ERROR_DS_NAME_ERROR_NO_MAPPING
//
// MessageText:
//
//  Name translation: Input name found, but not the associated output format.
//
pub const ERROR_DS_NAME_ERROR_NO_MAPPING: i32 = 8472;

//
// MessageId: ERROR_DS_NAME_ERROR_DOMAIN_ONLY
//
// MessageText:
//
//  Name translation: Unable to resolve completely, only the domain was found.
//
pub const ERROR_DS_NAME_ERROR_DOMAIN_ONLY: i32 = 8473;

//
// MessageId: ERROR_DS_NAME_ERROR_NO_SYNTACTICAL_MAPPING
//
// MessageText:
//
//  Name translation: Unable to perform purely syntactical mapping at the client without going out to the wire.
//
pub const ERROR_DS_NAME_ERROR_NO_SYNTACTICAL_MAPPING: i32 = 8474;

//
// MessageId: ERROR_DS_WRONG_OM_OBJ_CLASS
//
// MessageText:
//
//  The OM-Object-Class specified is incorrect for an attribute with the specified syntax.
//
pub const ERROR_DS_WRONG_OM_OBJ_CLASS: i32 = 8476;

//
// MessageId: ERROR_DS_DRA_REPL_PENDING
//
// MessageText:
//
//  The replication request has been posted; waiting for reply.
//
pub const ERROR_DS_DRA_REPL_PENDING: i32 = 8477;

//
// MessageId: ERROR_DS_DS_REQUIRED
//
// MessageText:
//
//  The requested operation requires a directory service, and none was available.
//
pub const ERROR_DS_DS_REQUIRED: i32 = 8478;

//
// MessageId: ERROR_DS_INVALID_LDAP_DISPLAY_NAME
//
// MessageText:
//
//  The LDAP display name of the class or attribute contains non-ASCII characters.
//
pub const ERROR_DS_INVALID_LDAP_DISPLAY_NAME: i32 = 8479;

//
// MessageId: ERROR_DS_NON_BASE_SEARCH
//
// MessageText:
//
//  The requested search operation is only supported for base searches.
//
pub const ERROR_DS_NON_BASE_SEARCH: i32 = 8480;

//
// MessageId: ERROR_DS_CANT_RETRIEVE_ATTS
//
// MessageText:
//
//  The search failed to retrieve attributes from the database.
//
pub const ERROR_DS_CANT_RETRIEVE_ATTS: i32 = 8481;

//
// MessageId: ERROR_DS_BACKLINK_WITHOUT_LINK
//
// MessageText:
//
//  The schema update operation tried to add a backward link attribute that has no corresponding forward link.
//
pub const ERROR_DS_BACKLINK_WITHOUT_LINK: i32 = 8482;

//
// MessageId: ERROR_DS_EPOCH_MISMATCH
//
// MessageText:
//
//  Source and destination of a cross-domain move do not agree on the object's epoch number.  Either source or destination does not have the latest version of the object.
//
pub const ERROR_DS_EPOCH_MISMATCH: i32 = 8483;

//
// MessageId: ERROR_DS_SRC_NAME_MISMATCH
//
// MessageText:
//
//  Source and destination of a cross-domain move do not agree on the object's current name.  Either source or destination does not have the latest version of the object.
//
pub const ERROR_DS_SRC_NAME_MISMATCH: i32 = 8484;

//
// MessageId: ERROR_DS_SRC_AND_DST_NC_IDENTICAL
//
// MessageText:
//
//  Source and destination for the cross-domain move operation are identical.  Caller should use local move operation instead of cross-domain move operation.
//
pub const ERROR_DS_SRC_AND_DST_NC_IDENTICAL: i32 = 8485;

//
// MessageId: ERROR_DS_DST_NC_MISMATCH
//
// MessageText:
//
//  Source and destination for a cross-domain move are not in agreement on the naming contexts in the forest.  Either source or destination does not have the latest version of the Partitions container.
//
pub const ERROR_DS_DST_NC_MISMATCH: i32 = 8486;

//
// MessageId: ERROR_DS_NOT_AUTHORITIVE_FOR_DST_NC
//
// MessageText:
//
//  Destination of a cross-domain move is not authoritative for the destination naming context.
//
pub const ERROR_DS_NOT_AUTHORITIVE_FOR_DST_NC: i32 = 8487;

//
// MessageId: ERROR_DS_SRC_GUID_MISMATCH
//
// MessageText:
//
//  Source and destination of a cross-domain move do not agree on the identity of the source object.  Either source or destination does not have the latest version of the source object.
//
pub const ERROR_DS_SRC_GUID_MISMATCH: i32 = 8488;

//
// MessageId: ERROR_DS_CANT_MOVE_DELETED_OBJECT
//
// MessageText:
//
//  Object being moved across-domains is already known to be deleted by the destination server.  The source server does not have the latest version of the source object.
//
pub const ERROR_DS_CANT_MOVE_DELETED_OBJECT: i32 = 8489;

//
// MessageId: ERROR_DS_PDC_OPERATION_IN_PROGRESS
//
// MessageText:
//
//  Another operation which requires exclusive access to the PDC FSMO is already in progress.
//
pub const ERROR_DS_PDC_OPERATION_IN_PROGRESS: i32 = 8490;

//
// MessageId: ERROR_DS_CROSS_DOMAIN_CLEANUP_REQD
//
// MessageText:
//
//  A cross-domain move operation failed such that two versions of the moved object exist - one each in the source and destination domains.  The destination object needs to be removed to restore the system to a consistent state.
//
pub const ERROR_DS_CROSS_DOMAIN_CLEANUP_REQD: i32 = 8491;

//
// MessageId: ERROR_DS_ILLEGAL_XDOM_MOVE_OPERATION
//
// MessageText:
//
//  This object may not be moved across domain boundaries either because cross-domain moves for this class are disallowed, or the object has some special characteristics, e.g.: trust account or restricted RID, which prevent its move.
//
pub const ERROR_DS_ILLEGAL_XDOM_MOVE_OPERATION: i32 = 8492;

//
// MessageId: ERROR_DS_CANT_WITH_ACCT_GROUP_MEMBERSHPS
//
// MessageText:
//
//  Can't move objects with memberships across domain boundaries as once moved, this would violate the membership conditions of the account group.  Remove the object from any account group memberships and retry.
//
pub const ERROR_DS_CANT_WITH_ACCT_GROUP_MEMBERSHPS: i32 = 8493;

//
// MessageId: ERROR_DS_NC_MUST_HAVE_NC_PARENT
//
// MessageText:
//
//  A naming context head must be the immediate child of another naming context head, not of an interior node.
//
pub const ERROR_DS_NC_MUST_HAVE_NC_PARENT: i32 = 8494;

//
// MessageId: ERROR_DS_CR_IMPOSSIBLE_TO_VALIDATE
//
// MessageText:
//
//  The directory cannot validate the proposed naming context name because it does not hold a replica of the naming context above the proposed naming context.  Please ensure that the domain naming master role is held by a server that is configured as a global catalog server, and that the server is up to date with its replication partners. (Applies only to Windows 2000 Domain Naming masters)
//
pub const ERROR_DS_CR_IMPOSSIBLE_TO_VALIDATE: i32 = 8495;

//
// MessageId: ERROR_DS_DST_DOMAIN_NOT_NATIVE
//
// MessageText:
//
//  Destination domain must be in native mode.
//
pub const ERROR_DS_DST_DOMAIN_NOT_NATIVE: i32 = 8496;

//
// MessageId: ERROR_DS_MISSING_INFRASTRUCTURE_CONTAINER
//
// MessageText:
//
//  The operation can not be performed because the server does not have an infrastructure container in the domain of interest.
//
pub const ERROR_DS_MISSING_INFRASTRUCTURE_CONTAINER: i32 = 8497;

//
// MessageId: ERROR_DS_CANT_MOVE_ACCOUNT_GROUP
//
// MessageText:
//
//  Cross-domain move of non-empty account groups is not allowed.
//
pub const ERROR_DS_CANT_MOVE_ACCOUNT_GROUP: i32 = 8498;

//
// MessageId: ERROR_DS_CANT_MOVE_RESOURCE_GROUP
//
// MessageText:
//
//  Cross-domain move of non-empty resource groups is not allowed.
//
pub const ERROR_DS_CANT_MOVE_RESOURCE_GROUP: i32 = 8499;

//
// MessageId: ERROR_DS_INVALID_SEARCH_FLAG
//
// MessageText:
//
//  The search flags for the attribute are invalid. The ANR bit is valid only on attributes of Unicode or Teletex strings.
//
pub const ERROR_DS_INVALID_SEARCH_FLAG: i32 = 8500;

//
// MessageId: ERROR_DS_NO_TREE_DELETE_ABOVE_NC
//
// MessageText:
//
//  Tree deletions starting at an object which has an NC head as a descendant are not allowed.
//
pub const ERROR_DS_NO_TREE_DELETE_ABOVE_NC: i32 = 8501;

//
// MessageId: ERROR_DS_COULDNT_LOCK_TREE_FOR_DELETE
//
// MessageText:
//
//  The directory service failed to lock a tree in preparation for a tree deletion because the tree was in use.
//
pub const ERROR_DS_COULDNT_LOCK_TREE_FOR_DELETE: i32 = 8502;

//
// MessageId: ERROR_DS_COULDNT_IDENTIFY_OBJECTS_FOR_TREE_DELETE
//
// MessageText:
//
//  The directory service failed to identify the list of objects to delete while attempting a tree deletion.
//
pub const ERROR_DS_COULDNT_IDENTIFY_OBJECTS_FOR_TREE_DELETE: i32 = 8503;

//
// MessageId: ERROR_DS_SAM_INIT_FAILURE
//
// MessageText:
//
//  Security Accounts Manager initialization failed because of the following error: %1.
//  Error Status: 0x%2. Click OK to shut down the system and reboot into Directory Services Restore Mode. Check the event log for detailed information.
//
pub const ERROR_DS_SAM_INIT_FAILURE: i32 = 8504;

//
// MessageId: ERROR_DS_SENSITIVE_GROUP_VIOLATION
//
// MessageText:
//
//  Only an administrator can modify the membership list of an administrative group.
//
pub const ERROR_DS_SENSITIVE_GROUP_VIOLATION: i32 = 8505;

//
// MessageId: ERROR_DS_CANT_MOD_PRIMARYGROUPID
//
// MessageText:
//
//  Cannot change the primary group ID of a domain controller account.
//
pub const ERROR_DS_CANT_MOD_PRIMARYGROUPID: i32 = 8506;

//
// MessageId: ERROR_DS_ILLEGAL_BASE_SCHEMA_MOD
//
// MessageText:
//
//  An attempt is made to modify the base schema.
//
pub const ERROR_DS_ILLEGAL_BASE_SCHEMA_MOD: i32 = 8507;

//
// MessageId: ERROR_DS_NONSAFE_SCHEMA_CHANGE
//
// MessageText:
//
//  Adding a new mandatory attribute to an existing class, deleting a mandatory attribute from an existing class, or adding an optional attribute to the special class Top that is not a backlink attribute (directly or through inheritance, for example, by adding or deleting an auxiliary class) is not allowed.
//
pub const ERROR_DS_NONSAFE_SCHEMA_CHANGE: i32 = 8508;

//
// MessageId: ERROR_DS_SCHEMA_UPDATE_DISALLOWED
//
// MessageText:
//
//  Schema update is not allowed on this DC because the DC is not the schema FSMO Role Owner.
//
pub const ERROR_DS_SCHEMA_UPDATE_DISALLOWED: i32 = 8509;

//
// MessageId: ERROR_DS_CANT_CREATE_UNDER_SCHEMA
//
// MessageText:
//
//  An object of this class cannot be created under the schema container. You can only create attribute-schema and class-schema objects under the schema container.
//
pub const ERROR_DS_CANT_CREATE_UNDER_SCHEMA: i32 = 8510;

//
// MessageId: ERROR_DS_INSTALL_NO_SRC_SCH_VERSION
//
// MessageText:
//
//  The replica/child install failed to get the objectVersion attribute on the schema container on the source DC. Either the attribute is missing on the schema container or the credentials supplied do not have permission to read it.
//
pub const ERROR_DS_INSTALL_NO_SRC_SCH_VERSION: i32 = 8511;

//
// MessageId: ERROR_DS_INSTALL_NO_SCH_VERSION_IN_INIFILE
//
// MessageText:
//
//  The replica/child install failed to read the objectVersion attribute in the SCHEMA section of the file schema.ini in the system32 directory.
//
pub const ERROR_DS_INSTALL_NO_SCH_VERSION_IN_INIFILE: i32 = 8512;

//
// MessageId: ERROR_DS_INVALID_GROUP_TYPE
//
// MessageText:
//
//  The specified group type is invalid.
//
pub const ERROR_DS_INVALID_GROUP_TYPE: i32 = 8513;

//
// MessageId: ERROR_DS_NO_NEST_GLOBALGROUP_IN_MIXEDDOMAIN
//
// MessageText:
//
//  You cannot nest global groups in a mixed domain if the group is security-enabled.
//
pub const ERROR_DS_NO_NEST_GLOBALGROUP_IN_MIXEDDOMAIN: i32 = 8514;

//
// MessageId: ERROR_DS_NO_NEST_LOCALGROUP_IN_MIXEDDOMAIN
//
// MessageText:
//
//  You cannot nest local groups in a mixed domain if the group is security-enabled.
//
pub const ERROR_DS_NO_NEST_LOCALGROUP_IN_MIXEDDOMAIN: i32 = 8515;

//
// MessageId: ERROR_DS_GLOBAL_CANT_HAVE_LOCAL_MEMBER
//
// MessageText:
//
//  A global group cannot have a local group as a member.
//
pub const ERROR_DS_GLOBAL_CANT_HAVE_LOCAL_MEMBER: i32 = 8516;

//
// MessageId: ERROR_DS_GLOBAL_CANT_HAVE_UNIVERSAL_MEMBER
//
// MessageText:
//
//  A global group cannot have a universal group as a member.
//
pub const ERROR_DS_GLOBAL_CANT_HAVE_UNIVERSAL_MEMBER: i32 = 8517;

//
// MessageId: ERROR_DS_UNIVERSAL_CANT_HAVE_LOCAL_MEMBER
//
// MessageText:
//
//  A universal group cannot have a local group as a member.
//
pub const ERROR_DS_UNIVERSAL_CANT_HAVE_LOCAL_MEMBER: i32 = 8518;

//
// MessageId: ERROR_DS_GLOBAL_CANT_HAVE_CROSSDOMAIN_MEMBER
//
// MessageText:
//
//  A global group cannot have a cross-domain member.
//
pub const ERROR_DS_GLOBAL_CANT_HAVE_CROSSDOMAIN_MEMBER: i32 = 8519;

//
// MessageId: ERROR_DS_LOCAL_CANT_HAVE_CROSSDOMAIN_LOCAL_MEMBER
//
// MessageText:
//
//  A local group cannot have another cross domain local group as a member.
//
pub const ERROR_DS_LOCAL_CANT_HAVE_CROSSDOMAIN_LOCAL_MEMBER: i32 = 8520;

//
// MessageId: ERROR_DS_HAVE_PRIMARY_MEMBERS
//
// MessageText:
//
//  A group with primary members cannot change to a security-disabled group.
//
pub const ERROR_DS_HAVE_PRIMARY_MEMBERS: i32 = 8521;

//
// MessageId: ERROR_DS_STRING_SD_CONVERSION_FAILED
//
// MessageText:
//
//  The schema cache load failed to convert the string default SD on a class-schema object.
//
pub const ERROR_DS_STRING_SD_CONVERSION_FAILED: i32 = 8522;

//
// MessageId: ERROR_DS_NAMING_MASTER_GC
//
// MessageText:
//
//  Only DSAs configured to be Global Catalog servers should be allowed to hold the Domain Naming Master FSMO role. (Applies only to Windows 2000 servers)
//
pub const ERROR_DS_NAMING_MASTER_GC: i32 = 8523;

//
// MessageId: ERROR_DS_DNS_LOOKUP_FAILURE
//
// MessageText:
//
//  The DSA operation is unable to proceed because of a DNS lookup failure.
//
pub const ERROR_DS_DNS_LOOKUP_FAILURE: i32 = 8524;

//
// MessageId: ERROR_DS_COULDNT_UPDATE_SPNS
//
// MessageText:
//
//  While processing a change to the DNS Host Name for an object, the Service Principal Name values could not be kept in sync.
//
pub const ERROR_DS_COULDNT_UPDATE_SPNS: i32 = 8525;

//
// MessageId: ERROR_DS_CANT_RETRIEVE_SD
//
// MessageText:
//
//  The Security Descriptor attribute could not be read.
//
pub const ERROR_DS_CANT_RETRIEVE_SD: i32 = 8526;

//
// MessageId: ERROR_DS_KEY_NOT_UNIQUE
//
// MessageText:
//
//  The object requested was not found, but an object with that key was found.
//
pub const ERROR_DS_KEY_NOT_UNIQUE: i32 = 8527;

//
// MessageId: ERROR_DS_WRONG_LINKED_ATT_SYNTAX
//
// MessageText:
//
//  The syntax of the linked attribute being added is incorrect. Forward links can only have syntax 2.5.5.1, 2.5.5.7, and 2.5.5.14, and backlinks can only have syntax 2.5.5.1
//
pub const ERROR_DS_WRONG_LINKED_ATT_SYNTAX: i32 = 8528;

//
// MessageId: ERROR_DS_SAM_NEED_BOOTKEY_PASSWORD
//
// MessageText:
//
//  Security Account Manager needs to get the boot password.
//
pub const ERROR_DS_SAM_NEED_BOOTKEY_PASSWORD: i32 = 8529;

//
// MessageId: ERROR_DS_SAM_NEED_BOOTKEY_FLOPPY
//
// MessageText:
//
//  Security Account Manager needs to get the boot key from floppy disk.
//
pub const ERROR_DS_SAM_NEED_BOOTKEY_FLOPPY: i32 = 8530;

//
// MessageId: ERROR_DS_CANT_START
//
// MessageText:
//
//  Directory Service cannot start.
//
pub const ERROR_DS_CANT_START: i32 = 8531;

//
// MessageId: ERROR_DS_INIT_FAILURE
//
// MessageText:
//
//  Directory Services could not start.
//
pub const ERROR_DS_INIT_FAILURE: i32 = 8532;

//
// MessageId: ERROR_DS_NO_PKT_PRIVACY_ON_CONNECTION
//
// MessageText:
//
//  The connection between client and server requires packet privacy or better.
//
pub const ERROR_DS_NO_PKT_PRIVACY_ON_CONNECTION: i32 = 8533;

//
// MessageId: ERROR_DS_SOURCE_DOMAIN_IN_FOREST
//
// MessageText:
//
//  The source domain may not be in the same forest as destination.
//
pub const ERROR_DS_SOURCE_DOMAIN_IN_FOREST: i32 = 8534;

//
// MessageId: ERROR_DS_DESTINATION_DOMAIN_NOT_IN_FOREST
//
// MessageText:
//
//  The destination domain must be in the forest.
//
pub const ERROR_DS_DESTINATION_DOMAIN_NOT_IN_FOREST: i32 = 8535;

//
// MessageId: ERROR_DS_DESTINATION_AUDITING_NOT_ENABLED
//
// MessageText:
//
//  The operation requires that destination domain auditing be enabled.
//
pub const ERROR_DS_DESTINATION_AUDITING_NOT_ENABLED: i32 = 8536;

//
// MessageId: ERROR_DS_CANT_FIND_DC_FOR_SRC_DOMAIN
//
// MessageText:
//
//  The operation couldn't locate a DC for the source domain.
//
pub const ERROR_DS_CANT_FIND_DC_FOR_SRC_DOMAIN: i32 = 8537;

//
// MessageId: ERROR_DS_SRC_OBJ_NOT_GROUP_OR_USER
//
// MessageText:
//
//  The source object must be a group or user.
//
pub const ERROR_DS_SRC_OBJ_NOT_GROUP_OR_USER: i32 = 8538;

//
// MessageId: ERROR_DS_SRC_SID_EXISTS_IN_FOREST
//
// MessageText:
//
//  The source object's SID already exists in destination forest.
//
pub const ERROR_DS_SRC_SID_EXISTS_IN_FOREST: i32 = 8539;

//
// MessageId: ERROR_DS_SRC_AND_DST_OBJECT_CLASS_MISMATCH
//
// MessageText:
//
//  The source and destination object must be of the same type.
//
pub const ERROR_DS_SRC_AND_DST_OBJECT_CLASS_MISMATCH: i32 = 8540;

//
// MessageId: ERROR_SAM_INIT_FAILURE
//
// MessageText:
//
//  Security Accounts Manager initialization failed because of the following error: %1.
//  Error Status: 0x%2. Click OK to shut down the system and reboot into Safe Mode. Check the event log for detailed information.
//
pub const ERROR_SAM_INIT_FAILURE: i32 = 8541;

//
// MessageId: ERROR_DS_DRA_SCHEMA_INFO_SHIP
//
// MessageText:
//
//  Schema information could not be included in the replication request.
//
pub const ERROR_DS_DRA_SCHEMA_INFO_SHIP: i32 = 8542;

//
// MessageId: ERROR_DS_DRA_SCHEMA_CONFLICT
//
// MessageText:
//
//  The replication operation could not be completed due to a schema incompatibility.
//
pub const ERROR_DS_DRA_SCHEMA_CONFLICT: i32 = 8543;

//
// MessageId: ERROR_DS_DRA_EARLIER_SCHEMA_CONFLICT
//
// MessageText:
//
//  The replication operation could not be completed due to a previous schema incompatibility.
//
pub const ERROR_DS_DRA_EARLIER_SCHEMA_CONFLICT: i32 = 8544;

//
// MessageId: ERROR_DS_DRA_OBJ_NC_MISMATCH
//
// MessageText:
//
//  The replication update could not be applied because either the source or the destination has not yet received information regarding a recent cross-domain move operation.
//
pub const ERROR_DS_DRA_OBJ_NC_MISMATCH: i32 = 8545;

//
// MessageId: ERROR_DS_NC_STILL_HAS_DSAS
//
// MessageText:
//
//  The requested domain could not be deleted because there exist domain controllers that still host this domain.
//
pub const ERROR_DS_NC_STILL_HAS_DSAS: i32 = 8546;

//
// MessageId: ERROR_DS_GC_REQUIRED
//
// MessageText:
//
//  The requested operation can be performed only on a global catalog server.
//
pub const ERROR_DS_GC_REQUIRED: i32 = 8547;

//
// MessageId: ERROR_DS_LOCAL_MEMBER_OF_LOCAL_ONLY
//
// MessageText:
//
//  A local group can only be a member of other local groups in the same domain.
//
pub const ERROR_DS_LOCAL_MEMBER_OF_LOCAL_ONLY: i32 = 8548;

//
// MessageId: ERROR_DS_NO_FPO_IN_UNIVERSAL_GROUPS
//
// MessageText:
//
//  Foreign security principals cannot be members of universal groups.
//
pub const ERROR_DS_NO_FPO_IN_UNIVERSAL_GROUPS: i32 = 8549;

//
// MessageId: ERROR_DS_CANT_ADD_TO_GC
//
// MessageText:
//
//  The attribute is not allowed to be replicated to the GC because of security reasons.
//
pub const ERROR_DS_CANT_ADD_TO_GC: i32 = 8550;

//
// MessageId: ERROR_DS_NO_CHECKPOINT_WITH_PDC
//
// MessageText:
//
//  The checkpoint with the PDC could not be taken because there too many modifications being processed currently.
//
pub const ERROR_DS_NO_CHECKPOINT_WITH_PDC: i32 = 8551;

//
// MessageId: ERROR_DS_SOURCE_AUDITING_NOT_ENABLED
//
// MessageText:
//
//  The operation requires that source domain auditing be enabled.
//
pub const ERROR_DS_SOURCE_AUDITING_NOT_ENABLED: i32 = 8552;

//
// MessageId: ERROR_DS_CANT_CREATE_IN_NONDOMAIN_NC
//
// MessageText:
//
//  Security principal objects can only be created inside domain naming contexts.
//
pub const ERROR_DS_CANT_CREATE_IN_NONDOMAIN_NC: i32 = 8553;

//
// MessageId: ERROR_DS_INVALID_NAME_FOR_SPN
//
// MessageText:
//
//  A Service Principal Name (SPN) could not be export constructed because the provided hostname is not in the necessary format.
//
pub const ERROR_DS_INVALID_NAME_FOR_SPN: i32 = 8554;

//
// MessageId: ERROR_DS_FILTER_USES_CONTRUCTED_ATTRS
//
// MessageText:
//
//  A Filter was passed that uses export constructed attributes.
//
pub const ERROR_DS_FILTER_USES_CONTRUCTED_ATTRS: i32 = 8555;

//
// MessageId: ERROR_DS_UNICODEPWD_NOT_IN_QUOTES
//
// MessageText:
//
//  The unicodePwd attribute value must be enclosed in double quotes.
//
pub const ERROR_DS_UNICODEPWD_NOT_IN_QUOTES: i32 = 8556;

//
// MessageId: ERROR_DS_MACHINE_ACCOUNT_QUOTA_EXCEEDED
//
// MessageText:
//
//  Your computer could not be joined to the domain. You have exceeded the maximum number of computer accounts you are allowed to create in this domain. Contact your system administrator to have this limit reset or increased.
//
pub const ERROR_DS_MACHINE_ACCOUNT_QUOTA_EXCEEDED: i32 = 8557;

//
// MessageId: ERROR_DS_MUST_BE_RUN_ON_DST_DC
//
// MessageText:
//
//  For security reasons, the operation must be run on the destination DC.
//
pub const ERROR_DS_MUST_BE_RUN_ON_DST_DC: i32 = 8558;

//
// MessageId: ERROR_DS_SRC_DC_MUST_BE_SP4_OR_GREATER
//
// MessageText:
//
//  For security reasons, the source DC must be NT4SP4 or greater.
//
pub const ERROR_DS_SRC_DC_MUST_BE_SP4_OR_GREATER: i32 = 8559;

//
// MessageId: ERROR_DS_CANT_TREE_DELETE_CRITICAL_OBJ
//
// MessageText:
//
//  Critical Directory Service System objects cannot be deleted during tree delete operations.  The tree delete may have been partially performed.
//
pub const ERROR_DS_CANT_TREE_DELETE_CRITICAL_OBJ: i32 = 8560;

//
// MessageId: ERROR_DS_INIT_FAILURE_CONSOLE
//
// MessageText:
//
//  Directory Services could not start because of the following error: %1.
//  Error Status: 0x%2. Please click OK to shutdown the system. You can use the recovery console to diagnose the system further.
//
pub const ERROR_DS_INIT_FAILURE_CONSOLE: i32 = 8561;

//
// MessageId: ERROR_DS_SAM_INIT_FAILURE_CONSOLE
//
// MessageText:
//
//  Security Accounts Manager initialization failed because of the following error: %1.
//  Error Status: 0x%2. Please click OK to shutdown the system. You can use the recovery console to diagnose the system further.
//
pub const ERROR_DS_SAM_INIT_FAILURE_CONSOLE: i32 = 8562;

//
// MessageId: ERROR_DS_FOREST_VERSION_TOO_HIGH
//
// MessageText:
//
//  The version of the operating system installed is incompatible with the current forest functional level. You must upgrade to a new version of the operating system before this server can become a domain controller in this forest.
//
pub const ERROR_DS_FOREST_VERSION_TOO_HIGH: i32 = 8563;

//
// MessageId: ERROR_DS_DOMAIN_VERSION_TOO_HIGH
//
// MessageText:
//
//  The version of the operating system installed is incompatible with the current domain functional level. You must upgrade to a new version of the operating system before this server can become a domain controller in this domain.
//
pub const ERROR_DS_DOMAIN_VERSION_TOO_HIGH: i32 = 8564;

//
// MessageId: ERROR_DS_FOREST_VERSION_TOO_LOW
//
// MessageText:
//
//  The version of the operating system installed on this server no longer supports the current forest functional level. You must raise the forest functional level before this server can become a domain controller in this forest.
//
pub const ERROR_DS_FOREST_VERSION_TOO_LOW: i32 = 8565;

//
// MessageId: ERROR_DS_DOMAIN_VERSION_TOO_LOW
//
// MessageText:
//
//  The version of the operating system installed on this server no longer supports the current domain functional level. You must raise the domain functional level before this server can become a domain controller in this domain.
//
pub const ERROR_DS_DOMAIN_VERSION_TOO_LOW: i32 = 8566;

//
// MessageId: ERROR_DS_INCOMPATIBLE_VERSION
//
// MessageText:
//
//  The version of the operating system installed on this server is incompatible with the functional level of the domain or forest.
//
pub const ERROR_DS_INCOMPATIBLE_VERSION: i32 = 8567;

//
// MessageId: ERROR_DS_LOW_DSA_VERSION
//
// MessageText:
//
//  The functional level of the domain (or forest) cannot be raised to the requested value, because there exist one or more domain controllers in the domain (or forest) that are at a lower incompatible functional level.
//
pub const ERROR_DS_LOW_DSA_VERSION: i32 = 8568;

//
// MessageId: ERROR_DS_NO_BEHAVIOR_VERSION_IN_MIXEDDOMAIN
//
// MessageText:
//
//  The forest functional level cannot be raised to the requested value since one or more domains are still in mixed domain mode. All domains in the forest must be in native mode, for you to raise the forest functional level.
//
pub const ERROR_DS_NO_BEHAVIOR_VERSION_IN_MIXEDDOMAIN: i32 = 8569;

//
// MessageId: ERROR_DS_NOT_SUPPORTED_SORT_ORDER
//
// MessageText:
//
//  The sort order requested is not supported.
//
pub const ERROR_DS_NOT_SUPPORTED_SORT_ORDER: i32 = 8570;

//
// MessageId: ERROR_DS_NAME_NOT_UNIQUE
//
// MessageText:
//
//  The requested name already exists as a unique identifier.
//
pub const ERROR_DS_NAME_NOT_UNIQUE: i32 = 8571;

//
// MessageId: ERROR_DS_MACHINE_ACCOUNT_CREATED_PRENT4
//
// MessageText:
//
//  The machine account was created pre-NT4.  The account needs to be recreated.
//
pub const ERROR_DS_MACHINE_ACCOUNT_CREATED_PRENT4: i32 = 8572;

//
// MessageId: ERROR_DS_OUT_OF_VERSION_STORE
//
// MessageText:
//
//  The database is out of version store.
//
pub const ERROR_DS_OUT_OF_VERSION_STORE: i32 = 8573;

//
// MessageId: ERROR_DS_INCOMPATIBLE_CONTROLS_USED
//
// MessageText:
//
//  Unable to continue operation because multiple conflicting controls were used.
//
pub const ERROR_DS_INCOMPATIBLE_CONTROLS_USED: i32 = 8574;

//
// MessageId: ERROR_DS_NO_REF_DOMAIN
//
// MessageText:
//
//  Unable to find a valid security descriptor reference domain for this partition.
//
pub const ERROR_DS_NO_REF_DOMAIN: i32 = 8575;

//
// MessageId: ERROR_DS_RESERVED_LINK_ID
//
// MessageText:
//
//  Schema update failed: The link identifier is reserved.
//
pub const ERROR_DS_RESERVED_LINK_ID: i32 = 8576;

//
// MessageId: ERROR_DS_LINK_ID_NOT_AVAILABLE
//
// MessageText:
//
//  Schema update failed: There are no link identifiers available.
//
pub const ERROR_DS_LINK_ID_NOT_AVAILABLE: i32 = 8577;

//
// MessageId: ERROR_DS_AG_CANT_HAVE_UNIVERSAL_MEMBER
//
// MessageText:
//
//  An account group can not have a universal group as a member.
//
pub const ERROR_DS_AG_CANT_HAVE_UNIVERSAL_MEMBER: i32 = 8578;

//
// MessageId: ERROR_DS_MODIFYDN_DISALLOWED_BY_INSTANCE_TYPE
//
// MessageText:
//
//  Rename or move operations on naming context heads or read-only objects are not allowed.
//
pub const ERROR_DS_MODIFYDN_DISALLOWED_BY_INSTANCE_TYPE: i32 = 8579;

//
// MessageId: ERROR_DS_NO_OBJECT_MOVE_IN_SCHEMA_NC
//
// MessageText:
//
//  Move operations on objects in the schema naming context are not allowed.
//
pub const ERROR_DS_NO_OBJECT_MOVE_IN_SCHEMA_NC: i32 = 8580;

//
// MessageId: ERROR_DS_MODIFYDN_DISALLOWED_BY_FLAG
//
// MessageText:
//
//  A system flag has been set on the object and does not allow the object to be moved or renamed.
//
pub const ERROR_DS_MODIFYDN_DISALLOWED_BY_FLAG: i32 = 8581;

//
// MessageId: ERROR_DS_MODIFYDN_WRONG_GRANDPARENT
//
// MessageText:
//
//  This object is not allowed to change its grandparent container. Moves are not forbidden on this object, but are restricted to sibling containers.
//
pub const ERROR_DS_MODIFYDN_WRONG_GRANDPARENT: i32 = 8582;

//
// MessageId: ERROR_DS_NAME_ERROR_TRUST_REFERRAL
//
// MessageText:
//
//  Unable to resolve completely, a referral to another forest is generated.
//
pub const ERROR_DS_NAME_ERROR_TRUST_REFERRAL: i32 = 8583;

//
// MessageId: ERROR_NOT_SUPPORTED_ON_STANDARD_SERVER
//
// MessageText:
//
//  The requested action is not supported on standard server.
//
pub const ERROR_NOT_SUPPORTED_ON_STANDARD_SERVER: i32 = 8584;

//
// MessageId: ERROR_DS_CANT_ACCESS_REMOTE_PART_OF_AD
//
// MessageText:
//
//  Could not access a partition of the Active Directory located on a remote server.  Make sure at least one server is running for the partition in question.
//
pub const ERROR_DS_CANT_ACCESS_REMOTE_PART_OF_AD: i32 = 8585;

//
// MessageId: ERROR_DS_CR_IMPOSSIBLE_TO_VALIDATE_V2
//
// MessageText:
//
//  The directory cannot validate the proposed naming context (or partition) name because it does not hold a replica nor can it contact a replica of the naming context above the proposed naming context.  Please ensure that the parent naming context is properly registered in DNS, and at least one replica of this naming context is reachable by the Domain Naming master.
//
pub const ERROR_DS_CR_IMPOSSIBLE_TO_VALIDATE_V2: i32 = 8586;

//
// MessageId: ERROR_DS_THREAD_LIMIT_EXCEEDED
//
// MessageText:
//
//  The thread limit for this request was exceeded.
//
pub const ERROR_DS_THREAD_LIMIT_EXCEEDED: i32 = 8587;

//
// MessageId: ERROR_DS_NOT_CLOSEST
//
// MessageText:
//
//  The Global catalog server is not in the closest site.
//
pub const ERROR_DS_NOT_CLOSEST: i32 = 8588;

//
// MessageId: ERROR_DS_CANT_DERIVE_SPN_WITHOUT_SERVER_REF
//
// MessageText:
//
//  The DS cannot derive a service principal name (SPN) with which to mutually authenticate the target server because the corresponding server object in the local DS database has no serverReference attribute.
//
pub const ERROR_DS_CANT_DERIVE_SPN_WITHOUT_SERVER_REF: i32 = 8589;

//
// MessageId: ERROR_DS_SINGLE_USER_MODE_FAILED
//
// MessageText:
//
//  The Directory Service failed to enter single user mode.
//
pub const ERROR_DS_SINGLE_USER_MODE_FAILED: i32 = 8590;

//
// MessageId: ERROR_DS_NTDSCRIPT_SYNTAX_ERROR
//
// MessageText:
//
//  The Directory Service cannot parse the script because of a syntax error.
//
pub const ERROR_DS_NTDSCRIPT_SYNTAX_ERROR: i32 = 8591;

//
// MessageId: ERROR_DS_NTDSCRIPT_PROCESS_ERROR
//
// MessageText:
//
//  The Directory Service cannot process the script because of an error.
//
pub const ERROR_DS_NTDSCRIPT_PROCESS_ERROR: i32 = 8592;

//
// MessageId: ERROR_DS_DIFFERENT_REPL_EPOCHS
//
// MessageText:
//
//  The directory service cannot perform the requested operation because the servers
//  involved are of different replication epochs (which is usually related to a
//  domain rename that is in progress).
//
pub const ERROR_DS_DIFFERENT_REPL_EPOCHS: i32 = 8593;

//
// MessageId: ERROR_DS_DRS_EXTENSIONS_CHANGED
//
// MessageText:
//
//  The directory service binding must be renegotiated due to a change in the server
//  extensions information.
//
pub const ERROR_DS_DRS_EXTENSIONS_CHANGED: i32 = 8594;

//
// MessageId: ERROR_DS_REPLICA_SET_CHANGE_NOT_ALLOWED_ON_DISABLED_CR
//
// MessageText:
//
//  Operation not allowed on a disabled cross ref.
//
pub const ERROR_DS_REPLICA_SET_CHANGE_NOT_ALLOWED_ON_DISABLED_CR: i32 = 8595;

//
// MessageId: ERROR_DS_NO_MSDS_INTID
//
// MessageText:
//
//  Schema update failed: No values for msDS-IntId are available.
//
pub const ERROR_DS_NO_MSDS_INTID: i32 = 8596;

//
// MessageId: ERROR_DS_DUP_MSDS_INTID
//
// MessageText:
//
//  Schema update failed: Duplicate msDS-INtId. Retry the operation.
//
pub const ERROR_DS_DUP_MSDS_INTID: i32 = 8597;

//
// MessageId: ERROR_DS_EXISTS_IN_RDNATTID
//
// MessageText:
//
//  Schema deletion failed: attribute is used in rDNAttID.
//
pub const ERROR_DS_EXISTS_IN_RDNATTID: i32 = 8598;

//
// MessageId: ERROR_DS_AUTHORIZATION_FAILED
//
// MessageText:
//
//  The directory service failed to authorize the request.
//
pub const ERROR_DS_AUTHORIZATION_FAILED: i32 = 8599;

//
// MessageId: ERROR_DS_INVALID_SCRIPT
//
// MessageText:
//
//  The Directory Service cannot process the script because it is invalid.
//
pub const ERROR_DS_INVALID_SCRIPT: i32 = 8600;

//
// MessageId: ERROR_DS_REMOTE_CROSSREF_OP_FAILED
//
// MessageText:
//
//  The remote create cross reference operation failed on the Domain Naming Master FSMO.  The operation's error is in the extended data.
//
pub const ERROR_DS_REMOTE_CROSSREF_OP_FAILED: i32 = 8601;

//
// MessageId: ERROR_DS_CROSS_REF_BUSY
//
// MessageText:
//
//  A cross reference is in use locally with the same name.
//
pub const ERROR_DS_CROSS_REF_BUSY: i32 = 8602;

//
// MessageId: ERROR_DS_CANT_DERIVE_SPN_FOR_DELETED_DOMAIN
//
// MessageText:
//
//  The DS cannot derive a service principal name (SPN) with which to mutually authenticate the target server because the server's domain has been deleted from the forest.
//
pub const ERROR_DS_CANT_DERIVE_SPN_FOR_DELETED_DOMAIN: i32 = 8603;

//
// MessageId: ERROR_DS_CANT_DEMOTE_WITH_WRITEABLE_NC
//
// MessageText:
//
//  Writeable NCs prevent this DC from demoting.
//
pub const ERROR_DS_CANT_DEMOTE_WITH_WRITEABLE_NC: i32 = 8604;

//
// MessageId: ERROR_DS_DUPLICATE_ID_FOUND
//
// MessageText:
//
//  The requested object has a non-unique identifier and cannot be retrieved.
//
pub const ERROR_DS_DUPLICATE_ID_FOUND: i32 = 8605;

//
// MessageId: ERROR_DS_INSUFFICIENT_ATTR_TO_CREATE_OBJECT
//
// MessageText:
//
//  Insufficient attributes were given to create an object.  This object may not exist because it may have been deleted and already garbage collected.
//
pub const ERROR_DS_INSUFFICIENT_ATTR_TO_CREATE_OBJECT: i32 = 8606;

//
// MessageId: ERROR_DS_GROUP_CONVERSION_ERROR
//
// MessageText:
//
//  The group cannot be converted due to attribute restrictions on the requested group type.
//
pub const ERROR_DS_GROUP_CONVERSION_ERROR: i32 = 8607;

//
// MessageId: ERROR_DS_CANT_MOVE_APP_BASIC_GROUP
//
// MessageText:
//
//  Cross-domain move of non-empty basic application groups is not allowed.
//
pub const ERROR_DS_CANT_MOVE_APP_BASIC_GROUP: i32 = 8608;

//
// MessageId: ERROR_DS_CANT_MOVE_APP_QUERY_GROUP
//
// MessageText:
//
//  Cross-domain move of non-empty query based application groups is not allowed.
//
pub const ERROR_DS_CANT_MOVE_APP_QUERY_GROUP: i32 = 8609;

//
// MessageId: ERROR_DS_ROLE_NOT_VERIFIED
//
// MessageText:
//
//  The FSMO role ownership could not be verified because its directory partition has not replicated successfully with atleast one replication partner.
//
pub const ERROR_DS_ROLE_NOT_VERIFIED: i32 = 8610;

//
// MessageId: ERROR_DS_WKO_CONTAINER_CANNOT_BE_SPECIAL
//
// MessageText:
//
//  The target container for a redirection of a well known object container cannot already be a special container.
//
pub const ERROR_DS_WKO_CONTAINER_CANNOT_BE_SPECIAL: i32 = 8611;

//
// MessageId: ERROR_DS_DOMAIN_RENAME_IN_PROGRESS
//
// MessageText:
//
//  The Directory Service cannot perform the requested operation because a domain rename operation is in progress.
//
pub const ERROR_DS_DOMAIN_RENAME_IN_PROGRESS: i32 = 8612;

//
// MessageId: ERROR_DS_EXISTING_AD_CHILD_NC
//
// MessageText:
//
//  The Active Directory detected an Active Directory child partition below the
//  requested new partition name.  The Active Directory's partition hierarchy must
//  be created in a top down method.
//
pub const ERROR_DS_EXISTING_AD_CHILD_NC: i32 = 8613;

//
// MessageId: ERROR_DS_REPL_LIFETIME_EXCEEDED
//
// MessageText:
//
//  The Active Directory cannot replicate with this server because the time since the last replication with this server has exceeded the tombstone lifetime.
//
pub const ERROR_DS_REPL_LIFETIME_EXCEEDED: i32 = 8614;

//
// MessageId: ERROR_DS_DISALLOWED_IN_SYSTEM_CONTAINER
//
// MessageText:
//
//  The requested operation is not allowed on an object under the system container.
//
pub const ERROR_DS_DISALLOWED_IN_SYSTEM_CONTAINER: i32 = 8615;

//
// MessageId: ERROR_DS_LDAP_SEND_QUEUE_FULL
//
// MessageText:
//
//  The LDAP servers network send queue has filled up because the client is not
//  processing the results of it's requests fast enough.  No more requests will
//  be processed until the client catches up.  If the client does not catch up
//  then it will be disconnected.
//
pub const ERROR_DS_LDAP_SEND_QUEUE_FULL: i32 = 8616;

//
// MessageId: ERROR_DS_DRA_OUT_SCHEDULE_WINDOW
//
// MessageText:
//
//  The scheduled replication did not take place because the system was too busy to execute the request within the schedule window.  The replication queue is overloaded. Consider reducing the number of partners or decreasing the scheduled replication frequency.
//
pub const ERROR_DS_DRA_OUT_SCHEDULE_WINDOW: i32 = 8617;

///////////////////////////////////////////////////
//                                                /
//     End of Active Directory Error Codes        /
//                                                /
//                  8000 to  8999                 /
///////////////////////////////////////////////////

///////////////////////////////////////////////////
//                                               //
//                  DNS Error Codes              //
//                                               //
//                   9000 to 9999                //
///////////////////////////////////////////////////

// =============================
// Facility DNS Error Messages
// =============================

//
//  DNS response codes.
//

pub const DNS_ERROR_RESPONSE_CODES_BASE: i32 = 9000;

// DNS_ERROR_RCODE_FORMAT_ERROR          0x00002329
//
// MessageId: DNS_ERROR_RCODE_FORMAT_ERROR
//
// MessageText:
//
//  DNS server unable to interpret format.
//
pub const DNS_ERROR_RCODE_FORMAT_ERROR: i32 = 9001;

// DNS_ERROR_RCODE_SERVER_FAILURE        0x0000232a
//
// MessageId: DNS_ERROR_RCODE_SERVER_FAILURE
//
// MessageText:
//
//  DNS server failure.
//
pub const DNS_ERROR_RCODE_SERVER_FAILURE: i32 = 9002;

// DNS_ERROR_RCODE_NAME_ERROR            0x0000232b
//
// MessageId: DNS_ERROR_RCODE_NAME_ERROR
//
// MessageText:
//
//  DNS name does not exist.
//
pub const DNS_ERROR_RCODE_NAME_ERROR: i32 = 9003;

// DNS_ERROR_RCODE_NOT_IMPLEMENTED       0x0000232c
//
// MessageId: DNS_ERROR_RCODE_NOT_IMPLEMENTED
//
// MessageText:
//
//  DNS request not supported by name server.
//
pub const DNS_ERROR_RCODE_NOT_IMPLEMENTED: i32 = 9004;

// DNS_ERROR_RCODE_REFUSED               0x0000232d
//
// MessageId: DNS_ERROR_RCODE_REFUSED
//
// MessageText:
//
//  DNS operation refused.
//
pub const DNS_ERROR_RCODE_REFUSED: i32 = 9005;

// DNS_ERROR_RCODE_YXDOMAIN              0x0000232e
//
// MessageId: DNS_ERROR_RCODE_YXDOMAIN
//
// MessageText:
//
//  DNS name that ought not exist, does exist.
//
pub const DNS_ERROR_RCODE_YXDOMAIN: i32 = 9006;

// DNS_ERROR_RCODE_YXRRSET               0x0000232f
//
// MessageId: DNS_ERROR_RCODE_YXRRSET
//
// MessageText:
//
//  DNS RR set that ought not exist, does exist.
//
pub const DNS_ERROR_RCODE_YXRRSET: i32 = 9007;

// DNS_ERROR_RCODE_NXRRSET               0x00002330
//
// MessageId: DNS_ERROR_RCODE_NXRRSET
//
// MessageText:
//
//  DNS RR set that ought to exist, does not exist.
//
pub const DNS_ERROR_RCODE_NXRRSET: i32 = 9008;

// DNS_ERROR_RCODE_NOTAUTH               0x00002331
//
// MessageId: DNS_ERROR_RCODE_NOTAUTH
//
// MessageText:
//
//  DNS server not authoritative for zone.
//
pub const DNS_ERROR_RCODE_NOTAUTH: i32 = 9009;

// DNS_ERROR_RCODE_NOTZONE               0x00002332
//
// MessageId: DNS_ERROR_RCODE_NOTZONE
//
// MessageText:
//
//  DNS name in update or prereq is not in zone.
//
pub const DNS_ERROR_RCODE_NOTZONE: i32 = 9010;

// DNS_ERROR_RCODE_BADSIG                0x00002338
//
// MessageId: DNS_ERROR_RCODE_BADSIG
//
// MessageText:
//
//  DNS signature failed to verify.
//
pub const DNS_ERROR_RCODE_BADSIG: i32 = 9016;

// DNS_ERROR_RCODE_BADKEY                0x00002339
//
// MessageId: DNS_ERROR_RCODE_BADKEY
//
// MessageText:
//
//  DNS bad key.
//
pub const DNS_ERROR_RCODE_BADKEY: i32 = 9017;

// DNS_ERROR_RCODE_BADTIME               0x0000233a
//
// MessageId: DNS_ERROR_RCODE_BADTIME
//
// MessageText:
//
//  DNS signature validity expired.
//
pub const DNS_ERROR_RCODE_BADTIME: i32 = 9018;

//
//  Packet format
//

pub const DNS_ERROR_PACKET_FMT_BASE: i32 = 9500;

// DNS_INFO_NO_RECORDS                   0x0000251d
//
// MessageId: DNS_INFO_NO_RECORDS
//
// MessageText:
//
//  No records found for given DNS query.
//
pub const DNS_INFO_NO_RECORDS: i32 = 9501;

// DNS_ERROR_BAD_PACKET                  0x0000251e
//
// MessageId: DNS_ERROR_BAD_PACKET
//
// MessageText:
//
//  Bad DNS packet.
//
pub const DNS_ERROR_BAD_PACKET: i32 = 9502;

// DNS_ERROR_NO_PACKET                   0x0000251f
//
// MessageId: DNS_ERROR_NO_PACKET
//
// MessageText:
//
//  No DNS packet.
//
pub const DNS_ERROR_NO_PACKET: i32 = 9503;

// DNS_ERROR_RCODE                       0x00002520
//
// MessageId: DNS_ERROR_RCODE
//
// MessageText:
//
//  DNS error, check rcode.
//
pub const DNS_ERROR_RCODE: i32 = 9504;

// DNS_ERROR_UNSECURE_PACKET             0x00002521
//
// MessageId: DNS_ERROR_UNSECURE_PACKET
//
// MessageText:
//
//  Unsecured DNS packet.
//
pub const DNS_ERROR_UNSECURE_PACKET: i32 = 9505;

//
//  General API errors
//

// DNS_ERROR_INVALID_TYPE                0x0000254f
//
// MessageId: DNS_ERROR_INVALID_TYPE
//
// MessageText:
//
//  Invalid DNS type.
//
pub const DNS_ERROR_INVALID_TYPE: i32 = 9551;

// DNS_ERROR_INVALID_IP_ADDRESS          0x00002550
//
// MessageId: DNS_ERROR_INVALID_IP_ADDRESS
//
// MessageText:
//
//  Invalid IP address.
//
pub const DNS_ERROR_INVALID_IP_ADDRESS: i32 = 9552;

// DNS_ERROR_INVALID_PROPERTY            0x00002551
//
// MessageId: DNS_ERROR_INVALID_PROPERTY
//
// MessageText:
//
//  Invalid property.
//
pub const DNS_ERROR_INVALID_PROPERTY: i32 = 9553;

// DNS_ERROR_TRY_AGAIN_LATER             0x00002552
//
// MessageId: DNS_ERROR_TRY_AGAIN_LATER
//
// MessageText:
//
//  Try DNS operation again later.
//
pub const DNS_ERROR_TRY_AGAIN_LATER: i32 = 9554;

// DNS_ERROR_NOT_UNIQUE                  0x00002553
//
// MessageId: DNS_ERROR_NOT_UNIQUE
//
// MessageText:
//
//  Record for given name and type is not unique.
//
pub const DNS_ERROR_NOT_UNIQUE: i32 = 9555;

// DNS_ERROR_NON_RFC_NAME                0x00002554
//
// MessageId: DNS_ERROR_NON_RFC_NAME
//
// MessageText:
//
//  DNS name does not comply with RFC specifications.
//
pub const DNS_ERROR_NON_RFC_NAME: i32 = 9556;

// DNS_STATUS_FQDN                       0x00002555
//
// MessageId: DNS_STATUS_FQDN
//
// MessageText:
//
//  DNS name is a fully-qualified DNS name.
//
pub const DNS_STATUS_FQDN: i32 = 9557;

// DNS_STATUS_DOTTED_NAME                0x00002556
//
// MessageId: DNS_STATUS_DOTTED_NAME
//
// MessageText:
//
//  DNS name is dotted (multi-label).
//
pub const DNS_STATUS_DOTTED_NAME: i32 = 9558;

// DNS_STATUS_SINGLE_PART_NAME           0x00002557
//
// MessageId: DNS_STATUS_SINGLE_PART_NAME
//
// MessageText:
//
//  DNS name is a single-part name.
//
pub const DNS_STATUS_SINGLE_PART_NAME: i32 = 9559;

// DNS_ERROR_INVALID_NAME_CHAR           0x00002558
//
// MessageId: DNS_ERROR_INVALID_NAME_CHAR
//
// MessageText:
//
//  DNS name contains an invalid character.
//
pub const DNS_ERROR_INVALID_NAME_CHAR: i32 = 9560;

// DNS_ERROR_NUMERIC_NAME                0x00002559
//
// MessageId: DNS_ERROR_NUMERIC_NAME
//
// MessageText:
//
//  DNS name is entirely numeric.
//
pub const DNS_ERROR_NUMERIC_NAME: i32 = 9561;

// DNS_ERROR_NOT_ALLOWED_ON_ROOT_SERVER  0x0000255A
//
// MessageId: DNS_ERROR_NOT_ALLOWED_ON_ROOT_SERVER
//
// MessageText:
//
//  The operation requested is not permitted on a DNS root server.
//
pub const DNS_ERROR_NOT_ALLOWED_ON_ROOT_SERVER: i32 = 9562;

// DNS_ERROR_NOT_ALLOWED_UNDER_DELEGATION  0x0000255B
//
// MessageId: DNS_ERROR_NOT_ALLOWED_UNDER_DELEGATION
//
// MessageText:
//
//  The record could not be created because this part of the DNS namespace has
//  been delegated to another server.
//
pub const DNS_ERROR_NOT_ALLOWED_UNDER_DELEGATION: i32 = 9563;

// DNS_ERROR_CANNOT_FIND_ROOT_HINTS  0x0000255C
//
// MessageId: DNS_ERROR_CANNOT_FIND_ROOT_HINTS
//
// MessageText:
//
//  The DNS server could not find a set of root hints.
//
pub const DNS_ERROR_CANNOT_FIND_ROOT_HINTS: i32 = 9564;

// DNS_ERROR_INCONSISTENT_ROOT_HINTS  0x0000255D
//
// MessageId: DNS_ERROR_INCONSISTENT_ROOT_HINTS
//
// MessageText:
//
//  The DNS server found root hints but they were not consistent across
//  all adapters.
//
pub const DNS_ERROR_INCONSISTENT_ROOT_HINTS: i32 = 9565;

//
//  Zone errors
//

pub const DNS_ERROR_ZONE_BASE: i32 = 9600;

// DNS_ERROR_ZONE_DOES_NOT_EXIST         0x00002581
//
// MessageId: DNS_ERROR_ZONE_DOES_NOT_EXIST
//
// MessageText:
//
//  DNS zone does not exist.
//
pub const DNS_ERROR_ZONE_DOES_NOT_EXIST: i32 = 9601;

// DNS_ERROR_NO_ZONE_INFO                0x00002582
//
// MessageId: DNS_ERROR_NO_ZONE_INFO
//
// MessageText:
//
//  DNS zone information not available.
//
pub const DNS_ERROR_NO_ZONE_INFO: i32 = 9602;

// DNS_ERROR_INVALID_ZONE_OPERATION      0x00002583
//
// MessageId: DNS_ERROR_INVALID_ZONE_OPERATION
//
// MessageText:
//
//  Invalid operation for DNS zone.
//
pub const DNS_ERROR_INVALID_ZONE_OPERATION: i32 = 9603;

// DNS_ERROR_ZONE_CONFIGURATION_ERROR    0x00002584
//
// MessageId: DNS_ERROR_ZONE_CONFIGURATION_ERROR
//
// MessageText:
//
//  Invalid DNS zone configuration.
//
pub const DNS_ERROR_ZONE_CONFIGURATION_ERROR: i32 = 9604;

// DNS_ERROR_ZONE_HAS_NO_SOA_RECORD      0x00002585
//
// MessageId: DNS_ERROR_ZONE_HAS_NO_SOA_RECORD
//
// MessageText:
//
//  DNS zone has no start of authority (SOA) record.
//
pub const DNS_ERROR_ZONE_HAS_NO_SOA_RECORD: i32 = 9605;

// DNS_ERROR_ZONE_HAS_NO_NS_RECORDS      0x00002586
//
// MessageId: DNS_ERROR_ZONE_HAS_NO_NS_RECORDS
//
// MessageText:
//
//  DNS zone has no Name Server (NS) record.
//
pub const DNS_ERROR_ZONE_HAS_NO_NS_RECORDS: i32 = 9606;

// DNS_ERROR_ZONE_LOCKED                 0x00002587
//
// MessageId: DNS_ERROR_ZONE_LOCKED
//
// MessageText:
//
//  DNS zone is locked.
//
pub const DNS_ERROR_ZONE_LOCKED: i32 = 9607;

// DNS_ERROR_ZONE_CREATION_FAILED        0x00002588
//
// MessageId: DNS_ERROR_ZONE_CREATION_FAILED
//
// MessageText:
//
//  DNS zone creation failed.
//
pub const DNS_ERROR_ZONE_CREATION_FAILED: i32 = 9608;

// DNS_ERROR_ZONE_ALREADY_EXISTS         0x00002589
//
// MessageId: DNS_ERROR_ZONE_ALREADY_EXISTS
//
// MessageText:
//
//  DNS zone already exists.
//
pub const DNS_ERROR_ZONE_ALREADY_EXISTS: i32 = 9609;

// DNS_ERROR_AUTOZONE_ALREADY_EXISTS     0x0000258a
//
// MessageId: DNS_ERROR_AUTOZONE_ALREADY_EXISTS
//
// MessageText:
//
//  DNS automatic zone already exists.
//
pub const DNS_ERROR_AUTOZONE_ALREADY_EXISTS: i32 = 9610;

// DNS_ERROR_INVALID_ZONE_TYPE           0x0000258b
//
// MessageId: DNS_ERROR_INVALID_ZONE_TYPE
//
// MessageText:
//
//  Invalid DNS zone type.
//
pub const DNS_ERROR_INVALID_ZONE_TYPE: i32 = 9611;

// DNS_ERROR_SECONDARY_REQUIRES_MASTER_IP 0x0000258c
//
// MessageId: DNS_ERROR_SECONDARY_REQUIRES_MASTER_IP
//
// MessageText:
//
//  Secondary DNS zone requires master IP address.
//
pub const DNS_ERROR_SECONDARY_REQUIRES_MASTER_IP: i32 = 9612;

// DNS_ERROR_ZONE_NOT_SECONDARY          0x0000258d
//
// MessageId: DNS_ERROR_ZONE_NOT_SECONDARY
//
// MessageText:
//
//  DNS zone not secondary.
//
pub const DNS_ERROR_ZONE_NOT_SECONDARY: i32 = 9613;

// DNS_ERROR_NEED_SECONDARY_ADDRESSES    0x0000258e
//
// MessageId: DNS_ERROR_NEED_SECONDARY_ADDRESSES
//
// MessageText:
//
//  Need secondary IP address.
//
pub const DNS_ERROR_NEED_SECONDARY_ADDRESSES: i32 = 9614;

// DNS_ERROR_WINS_INIT_FAILED            0x0000258f
//
// MessageId: DNS_ERROR_WINS_INIT_FAILED
//
// MessageText:
//
//  WINS initialization failed.
//
pub const DNS_ERROR_WINS_INIT_FAILED: i32 = 9615;

// DNS_ERROR_NEED_WINS_SERVERS           0x00002590
//
// MessageId: DNS_ERROR_NEED_WINS_SERVERS
//
// MessageText:
//
//  Need WINS servers.
//
pub const DNS_ERROR_NEED_WINS_SERVERS: i32 = 9616;

// DNS_ERROR_NBSTAT_INIT_FAILED          0x00002591
//
// MessageId: DNS_ERROR_NBSTAT_INIT_FAILED
//
// MessageText:
//
//  NBTSTAT initialization call failed.
//
pub const DNS_ERROR_NBSTAT_INIT_FAILED: i32 = 9617;

// DNS_ERROR_SOA_DELETE_INVALID          0x00002592
//
// MessageId: DNS_ERROR_SOA_DELETE_INVALID
//
// MessageText:
//
//  Invalid delete of start of authority (SOA)
//
pub const DNS_ERROR_SOA_DELETE_INVALID: i32 = 9618;

// DNS_ERROR_FORWARDER_ALREADY_EXISTS    0x00002593
//
// MessageId: DNS_ERROR_FORWARDER_ALREADY_EXISTS
//
// MessageText:
//
//  A conditional forwarding zone already exists for that name.
//
pub const DNS_ERROR_FORWARDER_ALREADY_EXISTS: i32 = 9619;

// DNS_ERROR_ZONE_REQUIRES_MASTER_IP     0x00002594
//
// MessageId: DNS_ERROR_ZONE_REQUIRES_MASTER_IP
//
// MessageText:
//
//  This zone must be configured with one or more master DNS server IP addresses.
//
pub const DNS_ERROR_ZONE_REQUIRES_MASTER_IP: i32 = 9620;

// DNS_ERROR_ZONE_IS_SHUTDOWN            0x00002595
//
// MessageId: DNS_ERROR_ZONE_IS_SHUTDOWN
//
// MessageText:
//
//  The operation cannot be performed because this zone is shutdown.
//
pub const DNS_ERROR_ZONE_IS_SHUTDOWN: i32 = 9621;

//
//  Datafile errors
//

// DNS                                   0x000025b3
//
// MessageId: DNS_ERROR_PRIMARY_REQUIRES_DATAFILE
//
// MessageText:
//
//  Primary DNS zone requires datafile.
//
pub const DNS_ERROR_PRIMARY_REQUIRES_DATAFILE: i32 = 9651;

// DNS                                   0x000025b4
//
// MessageId: DNS_ERROR_INVALID_DATAFILE_NAME
//
// MessageText:
//
//  Invalid datafile name for DNS zone.
//
pub const DNS_ERROR_INVALID_DATAFILE_NAME: i32 = 9652;

// DNS                                   0x000025b5
//
// MessageId: DNS_ERROR_DATAFILE_OPEN_FAILURE
//
// MessageText:
//
//  Failed to open datafile for DNS zone.
//
pub const DNS_ERROR_DATAFILE_OPEN_FAILURE: i32 = 9653;

// DNS                                   0x000025b6
//
// MessageId: DNS_ERROR_FILE_WRITEBACK_FAILED
//
// MessageText:
//
//  Failed to write datafile for DNS zone.
//
pub const DNS_ERROR_FILE_WRITEBACK_FAILED: i32 = 9654;

// DNS                                   0x000025b7
//
// MessageId: DNS_ERROR_DATAFILE_PARSING
//
// MessageText:
//
//  Failure while reading datafile for DNS zone.
//
pub const DNS_ERROR_DATAFILE_PARSING: i32 = 9655;

//
//  Database errors
//

pub const DNS_ERROR_DATABASE_BASE: i32 = 9700;

// DNS_ERROR_RECORD_DOES_NOT_EXIST       0x000025e5
//
// MessageId: DNS_ERROR_RECORD_DOES_NOT_EXIST
//
// MessageText:
//
//  DNS record does not exist.
//
pub const DNS_ERROR_RECORD_DOES_NOT_EXIST: i32 = 9701;

// DNS_ERROR_RECORD_FORMAT               0x000025e6
//
// MessageId: DNS_ERROR_RECORD_FORMAT
//
// MessageText:
//
//  DNS record format error.
//
pub const DNS_ERROR_RECORD_FORMAT: i32 = 9702;

// DNS_ERROR_NODE_CREATION_FAILED        0x000025e7
//
// MessageId: DNS_ERROR_NODE_CREATION_FAILED
//
// MessageText:
//
//  Node creation failure in DNS.
//
pub const DNS_ERROR_NODE_CREATION_FAILED: i32 = 9703;

// DNS_ERROR_UNKNOWN_RECORD_TYPE         0x000025e8
//
// MessageId: DNS_ERROR_UNKNOWN_RECORD_TYPE
//
// MessageText:
//
//  Unknown DNS record type.
//
pub const DNS_ERROR_UNKNOWN_RECORD_TYPE: i32 = 9704;

// DNS_ERROR_RECORD_TIMED_OUT            0x000025e9
//
// MessageId: DNS_ERROR_RECORD_TIMED_OUT
//
// MessageText:
//
//  DNS record timed out.
//
pub const DNS_ERROR_RECORD_TIMED_OUT: i32 = 9705;

// DNS_ERROR_NAME_NOT_IN_ZONE            0x000025ea
//
// MessageId: DNS_ERROR_NAME_NOT_IN_ZONE
//
// MessageText:
//
//  Name not in DNS zone.
//
pub const DNS_ERROR_NAME_NOT_IN_ZONE: i32 = 9706;

// DNS_ERROR_CNAME_LOOP                  0x000025eb
//
// MessageId: DNS_ERROR_CNAME_LOOP
//
// MessageText:
//
//  CNAME loop detected.
//
pub const DNS_ERROR_CNAME_LOOP: i32 = 9707;

// DNS_ERROR_NODE_IS_CNAME               0x000025ec
//
// MessageId: DNS_ERROR_NODE_IS_CNAME
//
// MessageText:
//
//  Node is a CNAME DNS record.
//
pub const DNS_ERROR_NODE_IS_CNAME: i32 = 9708;

// DNS_ERROR_CNAME_COLLISION             0x000025ed
//
// MessageId: DNS_ERROR_CNAME_COLLISION
//
// MessageText:
//
//  A CNAME record already exists for given name.
//
pub const DNS_ERROR_CNAME_COLLISION: i32 = 9709;

// DNS_ERROR_RECORD_ONLY_AT_ZONE_ROOT    0x000025ee
//
// MessageId: DNS_ERROR_RECORD_ONLY_AT_ZONE_ROOT
//
// MessageText:
//
//  Record only at DNS zone root.
//
pub const DNS_ERROR_RECORD_ONLY_AT_ZONE_ROOT: i32 = 9710;

// DNS_ERROR_RECORD_ALREADY_EXISTS       0x000025ef
//
// MessageId: DNS_ERROR_RECORD_ALREADY_EXISTS
//
// MessageText:
//
//  DNS record already exists.
//
pub const DNS_ERROR_RECORD_ALREADY_EXISTS: i32 = 9711;

// DNS_ERROR_SECONDARY_DATA              0x000025f0
//
// MessageId: DNS_ERROR_SECONDARY_DATA
//
// MessageText:
//
//  Secondary DNS zone data error.
//
pub const DNS_ERROR_SECONDARY_DATA: i32 = 9712;

// DNS_ERROR_NO_CREATE_CACHE_DATA        0x000025f1
//
// MessageId: DNS_ERROR_NO_CREATE_CACHE_DATA
//
// MessageText:
//
//  Could not create DNS cache data.
//
pub const DNS_ERROR_NO_CREATE_CACHE_DATA: i32 = 9713;

// DNS_ERROR_NAME_DOES_NOT_EXIST         0x000025f2
//
// MessageId: DNS_ERROR_NAME_DOES_NOT_EXIST
//
// MessageText:
//
//  DNS name does not exist.
//
pub const DNS_ERROR_NAME_DOES_NOT_EXIST: i32 = 9714;

// DNS_WARNING_PTR_CREATE_FAILED         0x000025f3
//
// MessageId: DNS_WARNING_PTR_CREATE_FAILED
//
// MessageText:
//
//  Could not create pointer (PTR) record.
//
pub const DNS_WARNING_PTR_CREATE_FAILED: i32 = 9715;

// DNS_WARNING_DOMAIN_UNDELETED          0x000025f4
//
// MessageId: DNS_WARNING_DOMAIN_UNDELETED
//
// MessageText:
//
//  DNS domain was undeleted.
//
pub const DNS_WARNING_DOMAIN_UNDELETED: i32 = 9716;

// DNS_ERROR_DS_UNAVAILABLE              0x000025f5
//
// MessageId: DNS_ERROR_DS_UNAVAILABLE
//
// MessageText:
//
//  The directory service is unavailable.
//
pub const DNS_ERROR_DS_UNAVAILABLE: i32 = 9717;

// DNS_ERROR_DS_ZONE_ALREADY_EXISTS      0x000025f6
//
// MessageId: DNS_ERROR_DS_ZONE_ALREADY_EXISTS
//
// MessageText:
//
//  DNS zone already exists in the directory service.
//
pub const DNS_ERROR_DS_ZONE_ALREADY_EXISTS: i32 = 9718;

// DNS_ERROR_NO_BOOTFILE_IF_DS_ZONE      0x000025f7
//
// MessageId: DNS_ERROR_NO_BOOTFILE_IF_DS_ZONE
//
// MessageText:
//
//  DNS server not creating or reading the boot file for the directory service integrated DNS zone.
//
pub const DNS_ERROR_NO_BOOTFILE_IF_DS_ZONE: i32 = 9719;

//
//  Operation errors
//

pub const DNS_ERROR_OPERATION_BASE: i32 = 9750;

// DNS_INFO_AXFR_COMPLETE                0x00002617
//
// MessageId: DNS_INFO_AXFR_COMPLETE
//
// MessageText:
//
//  DNS AXFR (zone transfer) complete.
//
pub const DNS_INFO_AXFR_COMPLETE: i32 = 9751;

// DNS_ERROR_AXFR                        0x00002618
//
// MessageId: DNS_ERROR_AXFR
//
// MessageText:
//
//  DNS zone transfer failed.
//
pub const DNS_ERROR_AXFR: i32 = 9752;

// DNS_INFO_ADDED_LOCAL_WINS             0x00002619
//
// MessageId: DNS_INFO_ADDED_LOCAL_WINS
//
// MessageText:
//
//  Added local WINS server.
//
pub const DNS_INFO_ADDED_LOCAL_WINS: i32 = 9753;

//
//  Secure update
//

pub const DNS_ERROR_SECURE_BASE: i32 = 9800;

// DNS_STATUS_CONTINUE_NEEDED            0x00002649
//
// MessageId: DNS_STATUS_CONTINUE_NEEDED
//
// MessageText:
//
//  Secure update call needs to continue update request.
//
pub const DNS_STATUS_CONTINUE_NEEDED: i32 = 9801;

//
//  Setup errors
//

pub const DNS_ERROR_SETUP_BASE: i32 = 9850;

// DNS_ERROR_NO_TCPIP                    0x0000267b
//
// MessageId: DNS_ERROR_NO_TCPIP
//
// MessageText:
//
//  TCP/IP network protocol not installed.
//
pub const DNS_ERROR_NO_TCPIP: i32 = 9851;

// DNS_ERROR_NO_DNS_SERVERS              0x0000267c
//
// MessageId: DNS_ERROR_NO_DNS_SERVERS
//
// MessageText:
//
//  No DNS servers configured for local system.
//
pub const DNS_ERROR_NO_DNS_SERVERS: i32 = 9852;

//
//  Directory partition (DP) errors
//

pub const DNS_ERROR_DP_BASE: i32 = 9900;

// DNS_ERROR_DP_DOES_NOT_EXIST           0x000026ad
//
// MessageId: DNS_ERROR_DP_DOES_NOT_EXIST
//
// MessageText:
//
//  The specified directory partition does not exist.
//
pub const DNS_ERROR_DP_DOES_NOT_EXIST: i32 = 9901;

// DNS_ERROR_DP_ALREADY_EXISTS           0x000026ae
//
// MessageId: DNS_ERROR_DP_ALREADY_EXISTS
//
// MessageText:
//
//  The specified directory partition already exists.
//
pub const DNS_ERROR_DP_ALREADY_EXISTS: i32 = 9902;

// DNS_ERROR_DP_NOT_ENLISTED             0x000026af
//
// MessageId: DNS_ERROR_DP_NOT_ENLISTED
//
// MessageText:
//
//  This DNS server is not enlisted in the specified directory partition.
//
pub const DNS_ERROR_DP_NOT_ENLISTED: i32 = 9903;

// DNS_ERROR_DP_ALREADY_ENLISTED         0x000026b0
//
// MessageId: DNS_ERROR_DP_ALREADY_ENLISTED
//
// MessageText:
//
//  This DNS server is already enlisted in the specified directory partition.
//
pub const DNS_ERROR_DP_ALREADY_ENLISTED: i32 = 9904;

// DNS_ERROR_DP_NOT_AVAILABLE            0x000026b1
//
// MessageId: DNS_ERROR_DP_NOT_AVAILABLE
//
// MessageText:
//
//  The directory partition is not available at this time. Please wait
//  a few minutes and try again.
//
pub const DNS_ERROR_DP_NOT_AVAILABLE: i32 = 9905;

// DNS_ERROR_DP_FSMO_ERROR               0x000026b2
//
// MessageId: DNS_ERROR_DP_FSMO_ERROR
//
// MessageText:
//
//  The application directory partition operation failed. The domain controller
//  holding the domain naming master role is down or unable to service the
//  request or is not running Windows Server 2003.
//
pub const DNS_ERROR_DP_FSMO_ERROR: i32 = 9906;

///////////////////////////////////////////////////
//                                               //
//             End of DNS Error Codes            //
//                                               //
//                  9000 to 9999                 //
///////////////////////////////////////////////////

///////////////////////////////////////////////////
//                                               //
//               WinSock Error Codes             //
//                                               //
//                 10000 to 11999                //
///////////////////////////////////////////////////

//
// WinSock error codes are also defined in WinSock.h
// and WinSock2.h, hence the IFDEF
//
pub const WSABASEERR: i32 = 10000;
//
// MessageId: WSAEINTR
//
// MessageText:
//
//  A blocking operation was interrupted by a call to WSACancelBlockingCall.
//
pub const WSAEINTR: i32 = 10004;

//
// MessageId: WSAEBADF
//
// MessageText:
//
//  The file handle supplied is not valid.
//
pub const WSAEBADF: i32 = 10009;

//
// MessageId: WSAEACCES
//
// MessageText:
//
//  An attempt was made to access a socket in a way forbidden by its access permissions.
//
pub const WSAEACCES: i32 = 10013;

//
// MessageId: WSAEFAULT
//
// MessageText:
//
//  The system detected an invalid pointer address in attempting to use a pointer argument in a call.
//
pub const WSAEFAULT: i32 = 10014;

//
// MessageId: WSAEINVAL
//
// MessageText:
//
//  An invalid argument was supplied.
//
pub const WSAEINVAL: i32 = 10022;

//
// MessageId: WSAEMFILE
//
// MessageText:
//
//  Too many open sockets.
//
pub const WSAEMFILE: i32 = 10024;

//
// MessageId: WSAEWOULDBLOCK
//
// MessageText:
//
//  A non-blocking socket operation could not be completed immediately.
//
pub const WSAEWOULDBLOCK: i32 = 10035;

//
// MessageId: WSAEINPROGRESS
//
// MessageText:
//
//  A blocking operation is currently executing.
//
pub const WSAEINPROGRESS: i32 = 10036;

//
// MessageId: WSAEALREADY
//
// MessageText:
//
//  An operation was attempted on a non-blocking socket that already had an operation in progress.
//
pub const WSAEALREADY: i32 = 10037;

//
// MessageId: WSAENOTSOCK
//
// MessageText:
//
//  An operation was attempted on something that is not a socket.
//
pub const WSAENOTSOCK: i32 = 10038;

//
// MessageId: WSAEDESTADDRREQ
//
// MessageText:
//
//  A required address was omitted from an operation on a socket.
//
pub const WSAEDESTADDRREQ: i32 = 10039;

//
// MessageId: WSAEMSGSIZE
//
// MessageText:
//
//  A message sent on a datagram socket was larger than the internal message buffer or some other network limit, or the buffer used to receive a datagram into was smaller than the datagram itself.
//
pub const WSAEMSGSIZE: i32 = 10040;

//
// MessageId: WSAEPROTOTYPE
//
// MessageText:
//
//  A protocol was specified in the socket function call that does not support the semantics of the socket type requested.
//
pub const WSAEPROTOTYPE: i32 = 10041;

//
// MessageId: WSAENOPROTOOPT
//
// MessageText:
//
//  An unknown, invalid, or unsupported option or level was specified in a getsockopt or setsockopt call.
//
pub const WSAENOPROTOOPT: i32 = 10042;

//
// MessageId: WSAEPROTONOSUPPORT
//
// MessageText:
//
//  The requested protocol has not been configured into the system, or no implementation for it exists.
//
pub const WSAEPROTONOSUPPORT: i32 = 10043;

//
// MessageId: WSAESOCKTNOSUPPORT
//
// MessageText:
//
//  The support for the specified socket type does not exist in this address family.
//
pub const WSAESOCKTNOSUPPORT: i32 = 10044;

//
// MessageId: WSAEOPNOTSUPP
//
// MessageText:
//
//  The attempted operation is not supported for the type of object referenced.
//
pub const WSAEOPNOTSUPP: i32 = 10045;

//
// MessageId: WSAEPFNOSUPPORT
//
// MessageText:
//
//  The protocol family has not been configured into the system or no implementation for it exists.
//
pub const WSAEPFNOSUPPORT: i32 = 10046;

//
// MessageId: WSAEAFNOSUPPORT
//
// MessageText:
//
//  An address incompatible with the requested protocol was used.
//
pub const WSAEAFNOSUPPORT: i32 = 10047;

//
// MessageId: WSAEADDRINUSE
//
// MessageText:
//
//  Only one usage of each socket address (protocol/network address/port) is normally permitted.
//
pub const WSAEADDRINUSE: i32 = 10048;

//
// MessageId: WSAEADDRNOTAVAIL
//
// MessageText:
//
//  The requested address is not valid in its context.
//
pub const WSAEADDRNOTAVAIL: i32 = 10049;

//
// MessageId: WSAENETDOWN
//
// MessageText:
//
//  A socket operation encountered a dead network.
//
pub const WSAENETDOWN: i32 = 10050;

//
// MessageId: WSAENETUNREACH
//
// MessageText:
//
//  A socket operation was attempted to an unreachable network.
//
pub const WSAENETUNREACH: i32 = 10051;

//
// MessageId: WSAENETRESET
//
// MessageText:
//
//  The connection has been broken due to keep-alive activity detecting a failure while the operation was in progress.
//
pub const WSAENETRESET: i32 = 10052;

//
// MessageId: WSAECONNABORTED
//
// MessageText:
//
//  An established connection was aborted by the software in your host machine.
//
pub const WSAECONNABORTED: i32 = 10053;

//
// MessageId: WSAECONNRESET
//
// MessageText:
//
//  An existing connection was forcibly closed by the remote host.
//
pub const WSAECONNRESET: i32 = 10054;

//
// MessageId: WSAENOBUFS
//
// MessageText:
//
//  An operation on a socket could not be performed because the system lacked sufficient buffer space or because a queue was full.
//
pub const WSAENOBUFS: i32 = 10055;

//
// MessageId: WSAEISCONN
//
// MessageText:
//
//  A connect request was made on an already connected socket.
//
pub const WSAEISCONN: i32 = 10056;

//
// MessageId: WSAENOTCONN
//
// MessageText:
//
//  A request to send or receive data was disallowed because the socket is not connected and (when sending on a datagram socket using a sendto call) no address was supplied.
//
pub const WSAENOTCONN: i32 = 10057;

//
// MessageId: WSAESHUTDOWN
//
// MessageText:
//
//  A request to send or receive data was disallowed because the socket had already been shut down in that direction with a previous shutdown call.
//
pub const WSAESHUTDOWN: i32 = 10058;

//
// MessageId: WSAETOOMANYREFS
//
// MessageText:
//
//  Too many references to some kernel object.
//
pub const WSAETOOMANYREFS: i32 = 10059;

//
// MessageId: WSAETIMEDOUT
//
// MessageText:
//
//  A connection attempt failed because the connected party did not properly respond after a period of time, or established connection failed because connected host has failed to respond.
//
pub const WSAETIMEDOUT: i32 = 10060;

//
// MessageId: WSAECONNREFUSED
//
// MessageText:
//
//  No connection could be made because the target machine actively refused it.
//
pub const WSAECONNREFUSED: i32 = 10061;

//
// MessageId: WSAELOOP
//
// MessageText:
//
//  Cannot translate name.
//
pub const WSAELOOP: i32 = 10062;

//
// MessageId: WSAENAMETOOLONG
//
// MessageText:
//
//  Name component or name was too long.
//
pub const WSAENAMETOOLONG: i32 = 10063;

//
// MessageId: WSAEHOSTDOWN
//
// MessageText:
//
//  A socket operation failed because the destination host was down.
//
pub const WSAEHOSTDOWN: i32 = 10064;

//
// MessageId: WSAEHOSTUNREACH
//
// MessageText:
//
//  A socket operation was attempted to an unreachable host.
//
pub const WSAEHOSTUNREACH: i32 = 10065;

//
// MessageId: WSAENOTEMPTY
//
// MessageText:
//
//  Cannot remove a directory that is not empty.
//
pub const WSAENOTEMPTY: i32 = 10066;

//
// MessageId: WSAEPROCLIM
//
// MessageText:
//
//  A Windows Sockets implementation may have a limit on the number of applications that may use it simultaneously.
//
pub const WSAEPROCLIM: i32 = 10067;

//
// MessageId: WSAEUSERS
//
// MessageText:
//
//  Ran out of quota.
//
pub const WSAEUSERS: i32 = 10068;

//
// MessageId: WSAEDQUOT
//
// MessageText:
//
//  Ran out of disk quota.
//
pub const WSAEDQUOT: i32 = 10069;

//
// MessageId: WSAESTALE
//
// MessageText:
//
//  File handle reference is no longer available.
//
pub const WSAESTALE: i32 = 10070;

//
// MessageId: WSAEREMOTE
//
// MessageText:
//
//  Item is not available locally.
//
pub const WSAEREMOTE: i32 = 10071;

//
// MessageId: WSASYSNOTREADY
//
// MessageText:
//
//  WSAStartup cannot function at this time because the underlying system it uses to provide network services is currently unavailable.
//
pub const WSASYSNOTREADY: i32 = 10091;

//
// MessageId: WSAVERNOTSUPPORTED
//
// MessageText:
//
//  The Windows Sockets version requested is not supported.
//
pub const WSAVERNOTSUPPORTED: i32 = 10092;

//
// MessageId: WSANOTINITIALISED
//
// MessageText:
//
//  Either the application has not called WSAStartup, or WSAStartup failed.
//
pub const WSANOTINITIALISED: i32 = 10093;

//
// MessageId: WSAEDISCON
//
// MessageText:
//
//  Returned by WSARecv or WSARecvFrom to indicate the remote party has initiated a graceful shutdown sequence.
//
pub const WSAEDISCON: i32 = 10101;

//
// MessageId: WSAENOMORE
//
// MessageText:
//
//  No more results can be returned by WSALookupServiceNext.
//
pub const WSAENOMORE: i32 = 10102;

//
// MessageId: WSAECANCELLED
//
// MessageText:
//
//  A call to WSALookupServiceEnd was made while this call was still processing. The call has been canceled.
//
pub const WSAECANCELLED: i32 = 10103;

//
// MessageId: WSAEINVALIDPROCTABLE
//
// MessageText:
//
//  The procedure call table is invalid.
//
pub const WSAEINVALIDPROCTABLE: i32 = 10104;

//
// MessageId: WSAEINVALIDPROVIDER
//
// MessageText:
//
//  The requested service provider is invalid.
//
pub const WSAEINVALIDPROVIDER: i32 = 10105;

//
// MessageId: WSAEPROVIDERFAILEDINIT
//
// MessageText:
//
//  The requested service provider could not be loaded or initialized.
//
pub const WSAEPROVIDERFAILEDINIT: i32 = 10106;

//
// MessageId: WSASYSCALLFAILURE
//
// MessageText:
//
//  A system call that should never fail has failed.
//
pub const WSASYSCALLFAILURE: i32 = 10107;

//
// MessageId: WSASERVICE_NOT_FOUND
//
// MessageText:
//
//  No such service is known. The service cannot be found in the specified name space.
//
pub const WSASERVICE_NOT_FOUND: i32 = 10108;

//
// MessageId: WSATYPE_NOT_FOUND
//
// MessageText:
//
//  The specified class was not found.
//
pub const WSATYPE_NOT_FOUND: i32 = 10109;

//
// MessageId: WSA_E_NO_MORE
//
// MessageText:
//
//  No more results can be returned by WSALookupServiceNext.
//
pub const WSA_E_NO_MORE: i32 = 10110;

//
// MessageId: WSA_E_CANCELLED
//
// MessageText:
//
//  A call to WSALookupServiceEnd was made while this call was still processing. The call has been canceled.
//
pub const WSA_E_CANCELLED: i32 = 10111;

//
// MessageId: WSAEREFUSED
//
// MessageText:
//
//  A database query failed because it was actively refused.
//
pub const WSAEREFUSED: i32 = 10112;

//
// MessageId: WSAHOST_NOT_FOUND
//
// MessageText:
//
//  No such host is known.
//
pub const WSAHOST_NOT_FOUND: i32 = 11001;

//
// MessageId: WSATRY_AGAIN
//
// MessageText:
//
//  This is usually a temporary error during hostname resolution and means that the local server did not receive a response from an authoritative server.
//
pub const WSATRY_AGAIN: i32 = 11002;

//
// MessageId: WSANO_RECOVERY
//
// MessageText:
//
//  A non-recoverable error occurred during a database lookup.
//
pub const WSANO_RECOVERY: i32 = 11003;

//
// MessageId: WSANO_DATA
//
// MessageText:
//
//  The requested name is valid, but no data of the requested type was found.
//
pub const WSANO_DATA: i32 = 11004;

//
// MessageId: WSA_QOS_RECEIVERS
//
// MessageText:
//
//  At least one reserve has arrived.
//
pub const WSA_QOS_RECEIVERS: i32 = 11005;

//
// MessageId: WSA_QOS_SENDERS
//
// MessageText:
//
//  At least one path has arrived.
//
pub const WSA_QOS_SENDERS: i32 = 11006;

//
// MessageId: WSA_QOS_NO_SENDERS
//
// MessageText:
//
//  There are no senders.
//
pub const WSA_QOS_NO_SENDERS: i32 = 11007;

//
// MessageId: WSA_QOS_NO_RECEIVERS
//
// MessageText:
//
//  There are no receivers.
//
pub const WSA_QOS_NO_RECEIVERS: i32 = 11008;

//
// MessageId: WSA_QOS_REQUEST_CONFIRMED
//
// MessageText:
//
//  Reserve has been confirmed.
//
pub const WSA_QOS_REQUEST_CONFIRMED: i32 = 11009;

//
// MessageId: WSA_QOS_ADMISSION_FAILURE
//
// MessageText:
//
//  Error due to lack of resources.
//
pub const WSA_QOS_ADMISSION_FAILURE: i32 = 11010;

//
// MessageId: WSA_QOS_POLICY_FAILURE
//
// MessageText:
//
//  Rejected for administrative reasons - bad credentials.
//
pub const WSA_QOS_POLICY_FAILURE: i32 = 11011;

//
// MessageId: WSA_QOS_BAD_STYLE
//
// MessageText:
//
//  Unknown or conflicting style.
//
pub const WSA_QOS_BAD_STYLE: i32 = 11012;

//
// MessageId: WSA_QOS_BAD_OBJECT
//
// MessageText:
//
//  Problem with some part of the filterspec or providerspecific buffer in general.
//
pub const WSA_QOS_BAD_OBJECT: i32 = 11013;

//
// MessageId: WSA_QOS_TRAFFIC_CTRL_ERROR
//
// MessageText:
//
//  Problem with some part of the flowspec.
//
pub const WSA_QOS_TRAFFIC_CTRL_ERROR: i32 = 11014;

//
// MessageId: WSA_QOS_GENERIC_ERROR
//
// MessageText:
//
//  General QOS error.
//
pub const WSA_QOS_GENERIC_ERROR: i32 = 11015;

//
// MessageId: WSA_QOS_ESERVICETYPE
//
// MessageText:
//
//  An invalid or unrecognized service type was found in the flowspec.
//
pub const WSA_QOS_ESERVICETYPE: i32 = 11016;

//
// MessageId: WSA_QOS_EFLOWSPEC
//
// MessageText:
//
//  An invalid or inconsistent flowspec was found in the QOS structure.
//
pub const WSA_QOS_EFLOWSPEC: i32 = 11017;

//
// MessageId: WSA_QOS_EPROVSPECBUF
//
// MessageText:
//
//  Invalid QOS provider-specific buffer.
//
pub const WSA_QOS_EPROVSPECBUF: i32 = 11018;

//
// MessageId: WSA_QOS_EFILTERSTYLE
//
// MessageText:
//
//  An invalid QOS filter style was used.
//
pub const WSA_QOS_EFILTERSTYLE: i32 = 11019;

//
// MessageId: WSA_QOS_EFILTERTYPE
//
// MessageText:
//
//  An invalid QOS filter type was used.
//
pub const WSA_QOS_EFILTERTYPE: i32 = 11020;

//
// MessageId: WSA_QOS_EFILTERCOUNT
//
// MessageText:
//
//  An incorrect number of QOS FILTERSPECs were specified in the FLOWDESCRIPTOR.
//
pub const WSA_QOS_EFILTERCOUNT: i32 = 11021;

//
// MessageId: WSA_QOS_EOBJLENGTH
//
// MessageText:
//
//  An object with an invalid ObjectLength field was specified in the QOS provider-specific buffer.
//
pub const WSA_QOS_EOBJLENGTH: i32 = 11022;

//
// MessageId: WSA_QOS_EFLOWCOUNT
//
// MessageText:
//
//  An incorrect number of flow descriptors was specified in the QOS structure.
//
pub const WSA_QOS_EFLOWCOUNT: i32 = 11023;

//
// MessageId: WSA_QOS_EUNKOWNPSOBJ
//
// MessageText:
//
//  An unrecognized object was found in the QOS provider-specific buffer.
//
pub const WSA_QOS_EUNKOWNPSOBJ: i32 = 11024;

//
// MessageId: WSA_QOS_EPOLICYOBJ
//
// MessageText:
//
//  An invalid policy object was found in the QOS provider-specific buffer.
//
pub const WSA_QOS_EPOLICYOBJ: i32 = 11025;

//
// MessageId: WSA_QOS_EFLOWDESC
//
// MessageText:
//
//  An invalid QOS flow descriptor was found in the flow descriptor list.
//
pub const WSA_QOS_EFLOWDESC: i32 = 11026;

//
// MessageId: WSA_QOS_EPSFLOWSPEC
//
// MessageText:
//
//  An invalid or inconsistent flowspec was found in the QOS provider specific buffer.
//
pub const WSA_QOS_EPSFLOWSPEC: i32 = 11027;

//
// MessageId: WSA_QOS_EPSFILTERSPEC
//
// MessageText:
//
//  An invalid FILTERSPEC was found in the QOS provider-specific buffer.
//
pub const WSA_QOS_EPSFILTERSPEC: i32 = 11028;

//
// MessageId: WSA_QOS_ESDMODEOBJ
//
// MessageText:
//
//  An invalid shape discard mode object was found in the QOS provider specific buffer.
//
pub const WSA_QOS_ESDMODEOBJ: i32 = 11029;

//
// MessageId: WSA_QOS_ESHAPERATEOBJ
//
// MessageText:
//
//  An invalid shaping rate object was found in the QOS provider-specific buffer.
//
pub const WSA_QOS_ESHAPERATEOBJ: i32 = 11030;

//
// MessageId: WSA_QOS_RESERVED_PETYPE
//
// MessageText:
//
//  A reserved policy element was found in the QOS provider-specific buffer.
//
pub const WSA_QOS_RESERVED_PETYPE: i32 = 11031;

///////////////////////////////////////////////////
//                                               //
//           End of WinSock Error Codes          //
//                                               //
//                 10000 to 11999                //
///////////////////////////////////////////////////

///////////////////////////////////////////////////
//                                               //
//             Side By Side Error Codes          //
//                                               //
//                 14000 to 14999                //
///////////////////////////////////////////////////

//
// MessageId: ERROR_SXS_SECTION_NOT_FOUND
//
// MessageText:
//
//  The requested section was not present in the activation context.
//
pub const ERROR_SXS_SECTION_NOT_FOUND: i32 = 14000;

//
// MessageId: ERROR_SXS_CANT_GEN_ACTCTX
//
// MessageText:
//
//  This application has failed to start because the application configuration is incorrect. Reinstalling the application may fix this problem.
//
pub const ERROR_SXS_CANT_GEN_ACTCTX: i32 = 14001;

//
// MessageId: ERROR_SXS_INVALID_ACTCTXDATA_FORMAT
//
// MessageText:
//
//  The application binding data format is invalid.
//
pub const ERROR_SXS_INVALID_ACTCTXDATA_FORMAT: i32 = 14002;

//
// MessageId: ERROR_SXS_ASSEMBLY_NOT_FOUND
//
// MessageText:
//
//  The referenced assembly is not installed on your system.
//
pub const ERROR_SXS_ASSEMBLY_NOT_FOUND: i32 = 14003;

//
// MessageId: ERROR_SXS_MANIFEST_FORMAT_ERROR
//
// MessageText:
//
//  The manifest file does not begin with the required tag and format information.
//
pub const ERROR_SXS_MANIFEST_FORMAT_ERROR: i32 = 14004;

//
// MessageId: ERROR_SXS_MANIFEST_PARSE_ERROR
//
// MessageText:
//
//  The manifest file contains one or more syntax errors.
//
pub const ERROR_SXS_MANIFEST_PARSE_ERROR: i32 = 14005;

//
// MessageId: ERROR_SXS_ACTIVATION_CONTEXT_DISABLED
//
// MessageText:
//
//  The application attempted to activate a disabled activation context.
//
pub const ERROR_SXS_ACTIVATION_CONTEXT_DISABLED: i32 = 14006;

//
// MessageId: ERROR_SXS_KEY_NOT_FOUND
//
// MessageText:
//
//  The requested lookup key was not found in any active activation context.
//
pub const ERROR_SXS_KEY_NOT_FOUND: i32 = 14007;

//
// MessageId: ERROR_SXS_VERSION_CONFLICT
//
// MessageText:
//
//  A component version required by the application conflicts with another component version already active.
//
pub const ERROR_SXS_VERSION_CONFLICT: i32 = 14008;

//
// MessageId: ERROR_SXS_WRONG_SECTION_TYPE
//
// MessageText:
//
//  The type requested activation context section does not match the query API used.
//
pub const ERROR_SXS_WRONG_SECTION_TYPE: i32 = 14009;

//
// MessageId: ERROR_SXS_THREAD_QUERIES_DISABLED
//
// MessageText:
//
//  Lack of system resources has required isolated activation to be disabled for the current thread of execution.
//
pub const ERROR_SXS_THREAD_QUERIES_DISABLED: i32 = 14010;

//
// MessageId: ERROR_SXS_PROCESS_DEFAULT_ALREADY_SET
//
// MessageText:
//
//  An attempt to set the process default activation context failed because the process default activation context was already set.
//
pub const ERROR_SXS_PROCESS_DEFAULT_ALREADY_SET: i32 = 14011;

//
// MessageId: ERROR_SXS_UNKNOWN_ENCODING_GROUP
//
// MessageText:
//
//  The encoding group identifier specified is not recognized.
//
pub const ERROR_SXS_UNKNOWN_ENCODING_GROUP: i32 = 14012;

//
// MessageId: ERROR_SXS_UNKNOWN_ENCODING
//
// MessageText:
//
//  The encoding requested is not recognized.
//
pub const ERROR_SXS_UNKNOWN_ENCODING: i32 = 14013;

//
// MessageId: ERROR_SXS_INVALID_XML_NAMESPACE_URI
//
// MessageText:
//
//  The manifest contains a reference to an invalid URI.
//
pub const ERROR_SXS_INVALID_XML_NAMESPACE_URI: i32 = 14014;

//
// MessageId: ERROR_SXS_ROOT_MANIFEST_DEPENDENCY_NOT_INSTALLED
//
// MessageText:
//
//  The application manifest contains a reference to a dependent assembly which is not installed
//
pub const ERROR_SXS_ROOT_MANIFEST_DEPENDENCY_NOT_INSTALLED: i32 = 14015;

//
// MessageId: ERROR_SXS_LEAF_MANIFEST_DEPENDENCY_NOT_INSTALLED
//
// MessageText:
//
//  The manifest for an assembly used by the application has a reference to a dependent assembly which is not installed
//
pub const ERROR_SXS_LEAF_MANIFEST_DEPENDENCY_NOT_INSTALLED: i32 = 14016;

//
// MessageId: ERROR_SXS_INVALID_ASSEMBLY_IDENTITY_ATTRIBUTE
//
// MessageText:
//
//  The manifest contains an attribute for the assembly identity which is not valid.
//
pub const ERROR_SXS_INVALID_ASSEMBLY_IDENTITY_ATTRIBUTE: i32 = 14017;

//
// MessageId: ERROR_SXS_MANIFEST_MISSING_REQUIRED_DEFAULT_NAMESPACE
//
// MessageText:
//
//  The manifest is missing the required default namespace specification on the assembly element.
//
pub const ERROR_SXS_MANIFEST_MISSING_REQUIRED_DEFAULT_NAMESPACE: i32 = 14018;

//
// MessageId: ERROR_SXS_MANIFEST_INVALID_REQUIRED_DEFAULT_NAMESPACE
//
// MessageText:
//
//  The manifest has a default namespace specified on the assembly element but its value is not "urn:schemas-microsoft-com:asm.v1".
//
pub const ERROR_SXS_MANIFEST_INVALID_REQUIRED_DEFAULT_NAMESPACE: i32 = 14019;

//
// MessageId: ERROR_SXS_PRIVATE_MANIFEST_CROSS_PATH_WITH_REPARSE_POINT
//
// MessageText:
//
//  The private manifest probed has crossed reparse-point-associated path
//
pub const ERROR_SXS_PRIVATE_MANIFEST_CROSS_PATH_WITH_REPARSE_POINT: i32 = 14020;

//
// MessageId: ERROR_SXS_DUPLICATE_DLL_NAME
//
// MessageText:
//
//  Two or more components referenced directly or indirectly by the application manifest have files by the same name.
//
pub const ERROR_SXS_DUPLICATE_DLL_NAME: i32 = 14021;

//
// MessageId: ERROR_SXS_DUPLICATE_WINDOWCLASS_NAME
//
// MessageText:
//
//  Two or more components referenced directly or indirectly by the application manifest have window classes with the same name.
//
pub const ERROR_SXS_DUPLICATE_WINDOWCLASS_NAME: i32 = 14022;

//
// MessageId: ERROR_SXS_DUPLICATE_CLSID
//
// MessageText:
//
//  Two or more components referenced directly or indirectly by the application manifest have the same COM server CLSIDs.
//
pub const ERROR_SXS_DUPLICATE_CLSID: i32 = 14023;

//
// MessageId: ERROR_SXS_DUPLICATE_IID
//
// MessageText:
//
//  Two or more components referenced directly or indirectly by the application manifest have proxies for the same COM interface IIDs.
//
pub const ERROR_SXS_DUPLICATE_IID: i32 = 14024;

//
// MessageId: ERROR_SXS_DUPLICATE_TLBID
//
// MessageText:
//
//  Two or more components referenced directly or indirectly by the application manifest have the same COM type library TLBIDs.
//
pub const ERROR_SXS_DUPLICATE_TLBID: i32 = 14025;

//
// MessageId: ERROR_SXS_DUPLICATE_PROGID
//
// MessageText:
//
//  Two or more components referenced directly or indirectly by the application manifest have the same COM ProgIDs.
//
pub const ERROR_SXS_DUPLICATE_PROGID: i32 = 14026;

//
// MessageId: ERROR_SXS_DUPLICATE_ASSEMBLY_NAME
//
// MessageText:
//
//  Two or more components referenced directly or indirectly by the application manifest are different versions of the same component which is not permitted.
//
pub const ERROR_SXS_DUPLICATE_ASSEMBLY_NAME: i32 = 14027;

//
// MessageId: ERROR_SXS_FILE_HASH_MISMATCH
//
// MessageText:
//
//  A component's file does not match the verification information present in the
//  component manifest.
//
pub const ERROR_SXS_FILE_HASH_MISMATCH: i32 = 14028;

//
// MessageId: ERROR_SXS_POLICY_PARSE_ERROR
//
// MessageText:
//
//  The policy manifest contains one or more syntax errors.
//
pub const ERROR_SXS_POLICY_PARSE_ERROR: i32 = 14029;

//
// MessageId: ERROR_SXS_XML_E_MISSINGQUOTE
//
// MessageText:
//
//  Manifest Parse Error : A string literal was expected, but no opening quote character was found.
//
pub const ERROR_SXS_XML_E_MISSINGQUOTE: i32 = 14030;

//
// MessageId: ERROR_SXS_XML_E_COMMENTSYNTAX
//
// MessageText:
//
//  Manifest Parse Error : Incorrect syntax was used in a comment.
//
pub const ERROR_SXS_XML_E_COMMENTSYNTAX: i32 = 14031;

//
// MessageId: ERROR_SXS_XML_E_BADSTARTNAMECHAR
//
// MessageText:
//
//  Manifest Parse Error : A name was started with an invalid character.
//
pub const ERROR_SXS_XML_E_BADSTARTNAMECHAR: i32 = 14032;

//
// MessageId: ERROR_SXS_XML_E_BADNAMECHAR
//
// MessageText:
//
//  Manifest Parse Error : A name contained an invalid character.
//
pub const ERROR_SXS_XML_E_BADNAMECHAR: i32 = 14033;

//
// MessageId: ERROR_SXS_XML_E_BADCHARINSTRING
//
// MessageText:
//
//  Manifest Parse Error : A string literal contained an invalid character.
//
pub const ERROR_SXS_XML_E_BADCHARINSTRING: i32 = 14034;

//
// MessageId: ERROR_SXS_XML_E_XMLDECLSYNTAX
//
// MessageText:
//
//  Manifest Parse Error : Invalid syntax for an xml declaration.
//
pub const ERROR_SXS_XML_E_XMLDECLSYNTAX: i32 = 14035;

//
// MessageId: ERROR_SXS_XML_E_BADCHARDATA
//
// MessageText:
//
//  Manifest Parse Error : An Invalid character was found in text content.
//
pub const ERROR_SXS_XML_E_BADCHARDATA: i32 = 14036;

//
// MessageId: ERROR_SXS_XML_E_MISSINGWHITESPACE
//
// MessageText:
//
//  Manifest Parse Error : Required white space was missing.
//
pub const ERROR_SXS_XML_E_MISSINGWHITESPACE: i32 = 14037;

//
// MessageId: ERROR_SXS_XML_E_EXPECTINGTAGEND
//
// MessageText:
//
//  Manifest Parse Error : The character '>' was expected.
//
pub const ERROR_SXS_XML_E_EXPECTINGTAGEND: i32 = 14038;

//
// MessageId: ERROR_SXS_XML_E_MISSINGSEMICOLON
//
// MessageText:
//
//  Manifest Parse Error : A semi colon character was expected.
//
pub const ERROR_SXS_XML_E_MISSINGSEMICOLON: i32 = 14039;

//
// MessageId: ERROR_SXS_XML_E_UNBALANCEDPAREN
//
// MessageText:
//
//  Manifest Parse Error : Unbalanced parentheses.
//
pub const ERROR_SXS_XML_E_UNBALANCEDPAREN: i32 = 14040;

//
// MessageId: ERROR_SXS_XML_E_INTERNALERROR
//
// MessageText:
//
//  Manifest Parse Error : Internal error.
//
pub const ERROR_SXS_XML_E_INTERNALERROR: i32 = 14041;

//
// MessageId: ERROR_SXS_XML_E_UNEXPECTED_WHITESPACE
//
// MessageText:
//
//  Manifest Parse Error : Whitespace is not allowed at this location.
//
pub const ERROR_SXS_XML_E_UNEXPECTED_WHITESPACE: i32 = 14042;

//
// MessageId: ERROR_SXS_XML_E_INCOMPLETE_ENCODING
//
// MessageText:
//
//  Manifest Parse Error : End of file reached in invalid state for current encoding.
//
pub const ERROR_SXS_XML_E_INCOMPLETE_ENCODING: i32 = 14043;

//
// MessageId: ERROR_SXS_XML_E_MISSING_PAREN
//
// MessageText:
//
//  Manifest Parse Error : Missing parenthesis.
//
pub const ERROR_SXS_XML_E_MISSING_PAREN: i32 = 14044;

//
// MessageId: ERROR_SXS_XML_E_EXPECTINGCLOSEQUOTE
//
// MessageText:
//
//  Manifest Parse Error : A single or double closing quote character (\' or \") is missing.
//
pub const ERROR_SXS_XML_E_EXPECTINGCLOSEQUOTE: i32 = 14045;

//
// MessageId: ERROR_SXS_XML_E_MULTIPLE_COLONS
//
// MessageText:
//
//  Manifest Parse Error : Multiple colons are not allowed in a name.
//
pub const ERROR_SXS_XML_E_MULTIPLE_COLONS: i32 = 14046;

//
// MessageId: ERROR_SXS_XML_E_INVALID_DECIMAL
//
// MessageText:
//
//  Manifest Parse Error : Invalid character for decimal digit.
//
pub const ERROR_SXS_XML_E_INVALID_DECIMAL: i32 = 14047;

//
// MessageId: ERROR_SXS_XML_E_INVALID_HEXIDECIMAL
//
// MessageText:
//
//  Manifest Parse Error : Invalid character for hexadecimal digit.
//
pub const ERROR_SXS_XML_E_INVALID_HEXIDECIMAL: i32 = 14048;

//
// MessageId: ERROR_SXS_XML_E_INVALID_UNICODE
//
// MessageText:
//
//  Manifest Parse Error : Invalid unicode character value for this platform.
//
pub const ERROR_SXS_XML_E_INVALID_UNICODE: i32 = 14049;

//
// MessageId: ERROR_SXS_XML_E_WHITESPACEORQUESTIONMARK
//
// MessageText:
//
//  Manifest Parse Error : Expecting whitespace or '?'.
//
pub const ERROR_SXS_XML_E_WHITESPACEORQUESTIONMARK: i32 = 14050;

//
// MessageId: ERROR_SXS_XML_E_UNEXPECTEDENDTAG
//
// MessageText:
//
//  Manifest Parse Error : End tag was not expected at this location.
//
pub const ERROR_SXS_XML_E_UNEXPECTEDENDTAG: i32 = 14051;

//
// MessageId: ERROR_SXS_XML_E_UNCLOSEDTAG
//
// MessageText:
//
//  Manifest Parse Error : The following tags were not closed: %1.
//
pub const ERROR_SXS_XML_E_UNCLOSEDTAG: i32 = 14052;

//
// MessageId: ERROR_SXS_XML_E_DUPLICATEATTRIBUTE
//
// MessageText:
//
//  Manifest Parse Error : Duplicate attribute.
//
pub const ERROR_SXS_XML_E_DUPLICATEATTRIBUTE: i32 = 14053;

//
// MessageId: ERROR_SXS_XML_E_MULTIPLEROOTS
//
// MessageText:
//
//  Manifest Parse Error : Only one top level element is allowed in an XML document.
//
pub const ERROR_SXS_XML_E_MULTIPLEROOTS: i32 = 14054;

//
// MessageId: ERROR_SXS_XML_E_INVALIDATROOTLEVEL
//
// MessageText:
//
//  Manifest Parse Error : Invalid at the top level of the document.
//
pub const ERROR_SXS_XML_E_INVALIDATROOTLEVEL: i32 = 14055;

//
// MessageId: ERROR_SXS_XML_E_BADXMLDECL
//
// MessageText:
//
//  Manifest Parse Error : Invalid xml declaration.
//
pub const ERROR_SXS_XML_E_BADXMLDECL: i32 = 14056;

//
// MessageId: ERROR_SXS_XML_E_MISSINGROOT
//
// MessageText:
//
//  Manifest Parse Error : XML document must have a top level element.
//
pub const ERROR_SXS_XML_E_MISSINGROOT: i32 = 14057;

//
// MessageId: ERROR_SXS_XML_E_UNEXPECTEDEOF
//
// MessageText:
//
//  Manifest Parse Error : Unexpected end of file.
//
pub const ERROR_SXS_XML_E_UNEXPECTEDEOF: i32 = 14058;

//
// MessageId: ERROR_SXS_XML_E_BADPEREFINSUBSET
//
// MessageText:
//
//  Manifest Parse Error : Parameter entities cannot be used inside markup declarations in an internal subset.
//
pub const ERROR_SXS_XML_E_BADPEREFINSUBSET: i32 = 14059;

//
// MessageId: ERROR_SXS_XML_E_UNCLOSEDSTARTTAG
//
// MessageText:
//
//  Manifest Parse Error : Element was not closed.
//
pub const ERROR_SXS_XML_E_UNCLOSEDSTARTTAG: i32 = 14060;

//
// MessageId: ERROR_SXS_XML_E_UNCLOSEDENDTAG
//
// MessageText:
//
//  Manifest Parse Error : End element was missing the character '>'.
//
pub const ERROR_SXS_XML_E_UNCLOSEDENDTAG: i32 = 14061;

//
// MessageId: ERROR_SXS_XML_E_UNCLOSEDSTRING
//
// MessageText:
//
//  Manifest Parse Error : A string literal was not closed.
//
pub const ERROR_SXS_XML_E_UNCLOSEDSTRING: i32 = 14062;

//
// MessageId: ERROR_SXS_XML_E_UNCLOSEDCOMMENT
//
// MessageText:
//
//  Manifest Parse Error : A comment was not closed.
//
pub const ERROR_SXS_XML_E_UNCLOSEDCOMMENT: i32 = 14063;

//
// MessageId: ERROR_SXS_XML_E_UNCLOSEDDECL
//
// MessageText:
//
//  Manifest Parse Error : A declaration was not closed.
//
pub const ERROR_SXS_XML_E_UNCLOSEDDECL: i32 = 14064;

//
// MessageId: ERROR_SXS_XML_E_UNCLOSEDCDATA
//
// MessageText:
//
//  Manifest Parse Error : A CDATA section was not closed.
//
pub const ERROR_SXS_XML_E_UNCLOSEDCDATA: i32 = 14065;

//
// MessageId: ERROR_SXS_XML_E_RESERVEDNAMESPACE
//
// MessageText:
//
//  Manifest Parse Error : The namespace prefix is not allowed to start with the reserved string "xml".
//
pub const ERROR_SXS_XML_E_RESERVEDNAMESPACE: i32 = 14066;

//
// MessageId: ERROR_SXS_XML_E_INVALIDENCODING
//
// MessageText:
//
//  Manifest Parse Error : System does not support the specified encoding.
//
pub const ERROR_SXS_XML_E_INVALIDENCODING: i32 = 14067;

//
// MessageId: ERROR_SXS_XML_E_INVALIDSWITCH
//
// MessageText:
//
//  Manifest Parse Error : Switch from current encoding to specified encoding not supported.
//
pub const ERROR_SXS_XML_E_INVALIDSWITCH: i32 = 14068;

//
// MessageId: ERROR_SXS_XML_E_BADXMLCASE
//
// MessageText:
//
//  Manifest Parse Error : The name 'xml' is reserved and must be lower case.
//
pub const ERROR_SXS_XML_E_BADXMLCASE: i32 = 14069;

//
// MessageId: ERROR_SXS_XML_E_INVALID_STANDALONE
//
// MessageText:
//
//  Manifest Parse Error : The standalone attribute must have the value 'yes' or 'no'.
//
pub const ERROR_SXS_XML_E_INVALID_STANDALONE: i32 = 14070;

//
// MessageId: ERROR_SXS_XML_E_UNEXPECTED_STANDALONE
//
// MessageText:
//
//  Manifest Parse Error : The standalone attribute cannot be used in external entities.
//
pub const ERROR_SXS_XML_E_UNEXPECTED_STANDALONE: i32 = 14071;

//
// MessageId: ERROR_SXS_XML_E_INVALID_VERSION
//
// MessageText:
//
//  Manifest Parse Error : Invalid version number.
//
pub const ERROR_SXS_XML_E_INVALID_VERSION: i32 = 14072;

//
// MessageId: ERROR_SXS_XML_E_MISSINGEQUALS
//
// MessageText:
//
//  Manifest Parse Error : Missing equals sign between attribute and attribute value.
//
pub const ERROR_SXS_XML_E_MISSINGEQUALS: i32 = 14073;

//
// MessageId: ERROR_SXS_PROTECTION_RECOVERY_FAILED
//
// MessageText:
//
//  Assembly Protection Error : Unable to recover the specified assembly.
//
pub const ERROR_SXS_PROTECTION_RECOVERY_FAILED: i32 = 14074;

//
// MessageId: ERROR_SXS_PROTECTION_PUBLIC_KEY_TOO_SHORT
//
// MessageText:
//
//  Assembly Protection Error : The public key for an assembly was too short to be allowed.
//
pub const ERROR_SXS_PROTECTION_PUBLIC_KEY_TOO_SHORT: i32 = 14075;

//
// MessageId: ERROR_SXS_PROTECTION_CATALOG_NOT_VALID
//
// MessageText:
//
//  Assembly Protection Error : The catalog for an assembly is not valid, or does not match the assembly's manifest.
//
pub const ERROR_SXS_PROTECTION_CATALOG_NOT_VALID: i32 = 14076;

//
// MessageId: ERROR_SXS_UNTRANSLATABLE_HRESULT
//
// MessageText:
//
//  An HRESULT could not be translated to a corresponding Win32 error code.
//
pub const ERROR_SXS_UNTRANSLATABLE_HRESULT: i32 = 14077;

//
// MessageId: ERROR_SXS_PROTECTION_CATALOG_FILE_MISSING
//
// MessageText:
//
//  Assembly Protection Error : The catalog for an assembly is missing.
//
pub const ERROR_SXS_PROTECTION_CATALOG_FILE_MISSING: i32 = 14078;

//
// MessageId: ERROR_SXS_MISSING_ASSEMBLY_IDENTITY_ATTRIBUTE
//
// MessageText:
//
//  The supplied assembly identity is missing one or more attributes which must be present in this context.
//
pub const ERROR_SXS_MISSING_ASSEMBLY_IDENTITY_ATTRIBUTE: i32 = 14079;

//
// MessageId: ERROR_SXS_INVALID_ASSEMBLY_IDENTITY_ATTRIBUTE_NAME
//
// MessageText:
//
//  The supplied assembly identity has one or more attribute names that contain characters not permitted in XML names.
//
pub const ERROR_SXS_INVALID_ASSEMBLY_IDENTITY_ATTRIBUTE_NAME: i32 = 14080;

///////////////////////////////////////////////////
//                                               //
//           End of Side By Side Error Codes     //
//                                               //
//                 14000 to 14999                //
///////////////////////////////////////////////////

///////////////////////////////////////////////////
//                                               //
//           Start of IPSec Error codes          //
//                                               //
//                 13000 to 13999                //
///////////////////////////////////////////////////

//
// MessageId: ERROR_IPSEC_QM_POLICY_EXISTS
//
// MessageText:
//
//  The specified quick mode policy already exists.
//
pub const ERROR_IPSEC_QM_POLICY_EXISTS: i32 = 13000;

//
// MessageId: ERROR_IPSEC_QM_POLICY_NOT_FOUND
//
// MessageText:
//
//  The specified quick mode policy was not found.
//
pub const ERROR_IPSEC_QM_POLICY_NOT_FOUND: i32 = 13001;

//
// MessageId: ERROR_IPSEC_QM_POLICY_IN_USE
//
// MessageText:
//
//  The specified quick mode policy is being used.
//
pub const ERROR_IPSEC_QM_POLICY_IN_USE: i32 = 13002;

//
// MessageId: ERROR_IPSEC_MM_POLICY_EXISTS
//
// MessageText:
//
//  The specified main mode policy already exists.
//
pub const ERROR_IPSEC_MM_POLICY_EXISTS: i32 = 13003;

//
// MessageId: ERROR_IPSEC_MM_POLICY_NOT_FOUND
//
// MessageText:
//
//  The specified main mode policy was not found
//
pub const ERROR_IPSEC_MM_POLICY_NOT_FOUND: i32 = 13004;

//
// MessageId: ERROR_IPSEC_MM_POLICY_IN_USE
//
// MessageText:
//
//  The specified main mode policy is being used.
//
pub const ERROR_IPSEC_MM_POLICY_IN_USE: i32 = 13005;

//
// MessageId: ERROR_IPSEC_MM_FILTER_EXISTS
//
// MessageText:
//
//  The specified main mode filter already exists.
//
pub const ERROR_IPSEC_MM_FILTER_EXISTS: i32 = 13006;

//
// MessageId: ERROR_IPSEC_MM_FILTER_NOT_FOUND
//
// MessageText:
//
//  The specified main mode filter was not found.
//
pub const ERROR_IPSEC_MM_FILTER_NOT_FOUND: i32 = 13007;

//
// MessageId: ERROR_IPSEC_TRANSPORT_FILTER_EXISTS
//
// MessageText:
//
//  The specified transport mode filter already exists.
//
pub const ERROR_IPSEC_TRANSPORT_FILTER_EXISTS: i32 = 13008;

//
// MessageId: ERROR_IPSEC_TRANSPORT_FILTER_NOT_FOUND
//
// MessageText:
//
//  The specified transport mode filter does not exist.
//
pub const ERROR_IPSEC_TRANSPORT_FILTER_NOT_FOUND: i32 = 13009;

//
// MessageId: ERROR_IPSEC_MM_AUTH_EXISTS
//
// MessageText:
//
//  The specified main mode authentication list exists.
//
pub const ERROR_IPSEC_MM_AUTH_EXISTS: i32 = 13010;

//
// MessageId: ERROR_IPSEC_MM_AUTH_NOT_FOUND
//
// MessageText:
//
//  The specified main mode authentication list was not found.
//
pub const ERROR_IPSEC_MM_AUTH_NOT_FOUND: i32 = 13011;

//
// MessageId: ERROR_IPSEC_MM_AUTH_IN_USE
//
// MessageText:
//
//  The specified quick mode policy is being used.
//
pub const ERROR_IPSEC_MM_AUTH_IN_USE: i32 = 13012;

//
// MessageId: ERROR_IPSEC_DEFAULT_MM_POLICY_NOT_FOUND
//
// MessageText:
//
//  The specified main mode policy was not found.
//
pub const ERROR_IPSEC_DEFAULT_MM_POLICY_NOT_FOUND: i32 = 13013;

//
// MessageId: ERROR_IPSEC_DEFAULT_MM_AUTH_NOT_FOUND
//
// MessageText:
//
//  The specified quick mode policy was not found
//
pub const ERROR_IPSEC_DEFAULT_MM_AUTH_NOT_FOUND: i32 = 13014;

//
// MessageId: ERROR_IPSEC_DEFAULT_QM_POLICY_NOT_FOUND
//
// MessageText:
//
//  The manifest file contains one or more syntax errors.
//
pub const ERROR_IPSEC_DEFAULT_QM_POLICY_NOT_FOUND: i32 = 13015;

//
// MessageId: ERROR_IPSEC_TUNNEL_FILTER_EXISTS
//
// MessageText:
//
//  The application attempted to activate a disabled activation context.
//
pub const ERROR_IPSEC_TUNNEL_FILTER_EXISTS: i32 = 13016;

//
// MessageId: ERROR_IPSEC_TUNNEL_FILTER_NOT_FOUND
//
// MessageText:
//
//  The requested lookup key was not found in any active activation context.
//
pub const ERROR_IPSEC_TUNNEL_FILTER_NOT_FOUND: i32 = 13017;

//
// MessageId: ERROR_IPSEC_MM_FILTER_PENDING_DELETION
//
// MessageText:
//
//  The Main Mode filter is pending deletion.
//
pub const ERROR_IPSEC_MM_FILTER_PENDING_DELETION: i32 = 13018;

//
// MessageId: ERROR_IPSEC_TRANSPORT_FILTER_PENDING_DELETION
//
// MessageText:
//
//  The transport filter is pending deletion.
//
pub const ERROR_IPSEC_TRANSPORT_FILTER_PENDING_DELETION: i32 = 13019;

//
// MessageId: ERROR_IPSEC_TUNNEL_FILTER_PENDING_DELETION
//
// MessageText:
//
//  The tunnel filter is pending deletion.
//
pub const ERROR_IPSEC_TUNNEL_FILTER_PENDING_DELETION: i32 = 13020;

//
// MessageId: ERROR_IPSEC_MM_POLICY_PENDING_DELETION
//
// MessageText:
//
//  The Main Mode policy is pending deletion.
//
pub const ERROR_IPSEC_MM_POLICY_PENDING_DELETION: i32 = 13021;

//
// MessageId: ERROR_IPSEC_MM_AUTH_PENDING_DELETION
//
// MessageText:
//
//  The Main Mode authentication bundle is pending deletion.
//
pub const ERROR_IPSEC_MM_AUTH_PENDING_DELETION: i32 = 13022;

//
// MessageId: ERROR_IPSEC_QM_POLICY_PENDING_DELETION
//
// MessageText:
//
//  The Quick Mode policy is pending deletion.
//
pub const ERROR_IPSEC_QM_POLICY_PENDING_DELETION: i32 = 13023;

//
// MessageId: WARNING_IPSEC_MM_POLICY_PRUNED
//
// MessageText:
//
//  The Main Mode policy was successfully added, but some of the requested offers are not supported.
//
pub const WARNING_IPSEC_MM_POLICY_PRUNED: i32 = 13024;

//
// MessageId: WARNING_IPSEC_QM_POLICY_PRUNED
//
// MessageText:
//
//  The Quick Mode policy was successfully added, but some of the requested offers are not supported.
//
pub const WARNING_IPSEC_QM_POLICY_PRUNED: i32 = 13025;

//
// MessageId: ERROR_IPSEC_IKE_NEG_STATUS_BEGIN
//
// MessageText:
//
//  ERROR_IPSEC_IKE_NEG_STATUS_BEGIN
//
pub const ERROR_IPSEC_IKE_NEG_STATUS_BEGIN: i32 = 13800;

//
// MessageId: ERROR_IPSEC_IKE_AUTH_FAIL
//
// MessageText:
//
//  IKE authentication credentials are unacceptable
//
pub const ERROR_IPSEC_IKE_AUTH_FAIL: i32 = 13801;

//
// MessageId: ERROR_IPSEC_IKE_ATTRIB_FAIL
//
// MessageText:
//
//  IKE security attributes are unacceptable
//
pub const ERROR_IPSEC_IKE_ATTRIB_FAIL: i32 = 13802;

//
// MessageId: ERROR_IPSEC_IKE_NEGOTIATION_PENDING
//
// MessageText:
//
//  IKE Negotiation in progress
//
pub const ERROR_IPSEC_IKE_NEGOTIATION_PENDING: i32 = 13803;

//
// MessageId: ERROR_IPSEC_IKE_GENERAL_PROCESSING_ERROR
//
// MessageText:
//
//  General processing error
//
pub const ERROR_IPSEC_IKE_GENERAL_PROCESSING_ERROR: i32 = 13804;

//
// MessageId: ERROR_IPSEC_IKE_TIMED_OUT
//
// MessageText:
//
//  Negotiation timed out
//
pub const ERROR_IPSEC_IKE_TIMED_OUT: i32 = 13805;

//
// MessageId: ERROR_IPSEC_IKE_NO_CERT
//
// MessageText:
//
//  IKE failed to find valid machine certificate
//
pub const ERROR_IPSEC_IKE_NO_CERT: i32 = 13806;

//
// MessageId: ERROR_IPSEC_IKE_SA_DELETED
//
// MessageText:
//
//  IKE SA deleted by peer before establishment completed
//
pub const ERROR_IPSEC_IKE_SA_DELETED: i32 = 13807;

//
// MessageId: ERROR_IPSEC_IKE_SA_REAPED
//
// MessageText:
//
//  IKE SA deleted before establishment completed
//
pub const ERROR_IPSEC_IKE_SA_REAPED: i32 = 13808;

//
// MessageId: ERROR_IPSEC_IKE_MM_ACQUIRE_DROP
//
// MessageText:
//
//  Negotiation request sat in Queue too long
//
pub const ERROR_IPSEC_IKE_MM_ACQUIRE_DROP: i32 = 13809;

//
// MessageId: ERROR_IPSEC_IKE_QM_ACQUIRE_DROP
//
// MessageText:
//
//  Negotiation request sat in Queue too long
//
pub const ERROR_IPSEC_IKE_QM_ACQUIRE_DROP: i32 = 13810;

//
// MessageId: ERROR_IPSEC_IKE_QUEUE_DROP_MM
//
// MessageText:
//
//  Negotiation request sat in Queue too long
//
pub const ERROR_IPSEC_IKE_QUEUE_DROP_MM: i32 = 13811;

//
// MessageId: ERROR_IPSEC_IKE_QUEUE_DROP_NO_MM
//
// MessageText:
//
//  Negotiation request sat in Queue too long
//
pub const ERROR_IPSEC_IKE_QUEUE_DROP_NO_MM: i32 = 13812;

//
// MessageId: ERROR_IPSEC_IKE_DROP_NO_RESPONSE
//
// MessageText:
//
//  No response from peer
//
pub const ERROR_IPSEC_IKE_DROP_NO_RESPONSE: i32 = 13813;

//
// MessageId: ERROR_IPSEC_IKE_MM_DELAY_DROP
//
// MessageText:
//
//  Negotiation took too long
//
pub const ERROR_IPSEC_IKE_MM_DELAY_DROP: i32 = 13814;

//
// MessageId: ERROR_IPSEC_IKE_QM_DELAY_DROP
//
// MessageText:
//
//  Negotiation took too long
//
pub const ERROR_IPSEC_IKE_QM_DELAY_DROP: i32 = 13815;

//
// MessageId: ERROR_IPSEC_IKE_ERROR
//
// MessageText:
//
//  Unknown error occurred
//
pub const ERROR_IPSEC_IKE_ERROR: i32 = 13816;

//
// MessageId: ERROR_IPSEC_IKE_CRL_FAILED
//
// MessageText:
//
//  Certificate Revocation Check failed
//
pub const ERROR_IPSEC_IKE_CRL_FAILED: i32 = 13817;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_KEY_USAGE
//
// MessageText:
//
//  Invalid certificate key usage
//
pub const ERROR_IPSEC_IKE_INVALID_KEY_USAGE: i32 = 13818;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_CERT_TYPE
//
// MessageText:
//
//  Invalid certificate type
//
pub const ERROR_IPSEC_IKE_INVALID_CERT_TYPE: i32 = 13819;

//
// MessageId: ERROR_IPSEC_IKE_NO_PRIVATE_KEY
//
// MessageText:
//
//  No private key associated with machine certificate
//
pub const ERROR_IPSEC_IKE_NO_PRIVATE_KEY: i32 = 13820;

//
// MessageId: ERROR_IPSEC_IKE_DH_FAIL
//
// MessageText:
//
//  Failure in Diffie-Hellman computation
//
pub const ERROR_IPSEC_IKE_DH_FAIL: i32 = 13822;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_HEADER
//
// MessageText:
//
//  Invalid header
//
pub const ERROR_IPSEC_IKE_INVALID_HEADER: i32 = 13824;

//
// MessageId: ERROR_IPSEC_IKE_NO_POLICY
//
// MessageText:
//
//  No policy configured
//
pub const ERROR_IPSEC_IKE_NO_POLICY: i32 = 13825;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_SIGNATURE
//
// MessageText:
//
//  Failed to verify signature
//
pub const ERROR_IPSEC_IKE_INVALID_SIGNATURE: i32 = 13826;

//
// MessageId: ERROR_IPSEC_IKE_KERBEROS_ERROR
//
// MessageText:
//
//  Failed to authenticate using kerberos
//
pub const ERROR_IPSEC_IKE_KERBEROS_ERROR: i32 = 13827;

//
// MessageId: ERROR_IPSEC_IKE_NO_PUBLIC_KEY
//
// MessageText:
//
//  Peer's certificate did not have a public key
//
pub const ERROR_IPSEC_IKE_NO_PUBLIC_KEY: i32 = 13828;

// These must stay as a unit.
//
// MessageId: ERROR_IPSEC_IKE_PROCESS_ERR
//
// MessageText:
//
//  Error processing error payload
//
pub const ERROR_IPSEC_IKE_PROCESS_ERR: i32 = 13829;

//
// MessageId: ERROR_IPSEC_IKE_PROCESS_ERR_SA
//
// MessageText:
//
//  Error processing SA payload
//
pub const ERROR_IPSEC_IKE_PROCESS_ERR_SA: i32 = 13830;

//
// MessageId: ERROR_IPSEC_IKE_PROCESS_ERR_PROP
//
// MessageText:
//
//  Error processing Proposal payload
//
pub const ERROR_IPSEC_IKE_PROCESS_ERR_PROP: i32 = 13831;

//
// MessageId: ERROR_IPSEC_IKE_PROCESS_ERR_TRANS
//
// MessageText:
//
//  Error processing Transform payload
//
pub const ERROR_IPSEC_IKE_PROCESS_ERR_TRANS: i32 = 13832;

//
// MessageId: ERROR_IPSEC_IKE_PROCESS_ERR_KE
//
// MessageText:
//
//  Error processing KE payload
//
pub const ERROR_IPSEC_IKE_PROCESS_ERR_KE: i32 = 13833;

//
// MessageId: ERROR_IPSEC_IKE_PROCESS_ERR_ID
//
// MessageText:
//
//  Error processing ID payload
//
pub const ERROR_IPSEC_IKE_PROCESS_ERR_ID: i32 = 13834;

//
// MessageId: ERROR_IPSEC_IKE_PROCESS_ERR_CERT
//
// MessageText:
//
//  Error processing Cert payload
//
pub const ERROR_IPSEC_IKE_PROCESS_ERR_CERT: i32 = 13835;

//
// MessageId: ERROR_IPSEC_IKE_PROCESS_ERR_CERT_REQ
//
// MessageText:
//
//  Error processing Certificate Request payload
//
pub const ERROR_IPSEC_IKE_PROCESS_ERR_CERT_REQ: i32 = 13836;

//
// MessageId: ERROR_IPSEC_IKE_PROCESS_ERR_HASH
//
// MessageText:
//
//  Error processing Hash payload
//
pub const ERROR_IPSEC_IKE_PROCESS_ERR_HASH: i32 = 13837;

//
// MessageId: ERROR_IPSEC_IKE_PROCESS_ERR_SIG
//
// MessageText:
//
//  Error processing Signature payload
//
pub const ERROR_IPSEC_IKE_PROCESS_ERR_SIG: i32 = 13838;

//
// MessageId: ERROR_IPSEC_IKE_PROCESS_ERR_NONCE
//
// MessageText:
//
//  Error processing Nonce payload
//
pub const ERROR_IPSEC_IKE_PROCESS_ERR_NONCE: i32 = 13839;

//
// MessageId: ERROR_IPSEC_IKE_PROCESS_ERR_NOTIFY
//
// MessageText:
//
//  Error processing Notify payload
//
pub const ERROR_IPSEC_IKE_PROCESS_ERR_NOTIFY: i32 = 13840;

//
// MessageId: ERROR_IPSEC_IKE_PROCESS_ERR_DELETE
//
// MessageText:
//
//  Error processing Delete Payload
//
pub const ERROR_IPSEC_IKE_PROCESS_ERR_DELETE: i32 = 13841;

//
// MessageId: ERROR_IPSEC_IKE_PROCESS_ERR_VENDOR
//
// MessageText:
//
//  Error processing VendorId payload
//
pub const ERROR_IPSEC_IKE_PROCESS_ERR_VENDOR: i32 = 13842;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_PAYLOAD
//
// MessageText:
//
//  Invalid payload received
//
pub const ERROR_IPSEC_IKE_INVALID_PAYLOAD: i32 = 13843;

//
// MessageId: ERROR_IPSEC_IKE_LOAD_SOFT_SA
//
// MessageText:
//
//  Soft SA loaded
//
pub const ERROR_IPSEC_IKE_LOAD_SOFT_SA: i32 = 13844;

//
// MessageId: ERROR_IPSEC_IKE_SOFT_SA_TORN_DOWN
//
// MessageText:
//
//  Soft SA torn down
//
pub const ERROR_IPSEC_IKE_SOFT_SA_TORN_DOWN: i32 = 13845;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_COOKIE
//
// MessageText:
//
//  Invalid cookie received.
//
pub const ERROR_IPSEC_IKE_INVALID_COOKIE: i32 = 13846;

//
// MessageId: ERROR_IPSEC_IKE_NO_PEER_CERT
//
// MessageText:
//
//  Peer failed to send valid machine certificate
//
pub const ERROR_IPSEC_IKE_NO_PEER_CERT: i32 = 13847;

//
// MessageId: ERROR_IPSEC_IKE_PEER_CRL_FAILED
//
// MessageText:
//
//  Certification Revocation check of peer's certificate failed
//
pub const ERROR_IPSEC_IKE_PEER_CRL_FAILED: i32 = 13848;

//
// MessageId: ERROR_IPSEC_IKE_POLICY_CHANGE
//
// MessageText:
//
//  New policy invalidated SAs formed with old policy
//
pub const ERROR_IPSEC_IKE_POLICY_CHANGE: i32 = 13849;

//
// MessageId: ERROR_IPSEC_IKE_NO_MM_POLICY
//
// MessageText:
//
//  There is no available Main Mode IKE policy.
//
pub const ERROR_IPSEC_IKE_NO_MM_POLICY: i32 = 13850;

//
// MessageId: ERROR_IPSEC_IKE_NOTCBPRIV
//
// MessageText:
//
//  Failed to enabled TCB privilege.
//
pub const ERROR_IPSEC_IKE_NOTCBPRIV: i32 = 13851;

//
// MessageId: ERROR_IPSEC_IKE_SECLOADFAIL
//
// MessageText:
//
//  Failed to load SECURITY.DLL.
//
pub const ERROR_IPSEC_IKE_SECLOADFAIL: i32 = 13852;

//
// MessageId: ERROR_IPSEC_IKE_FAILSSPINIT
//
// MessageText:
//
//  Failed to obtain security function table dispatch address from SSPI.
//
pub const ERROR_IPSEC_IKE_FAILSSPINIT: i32 = 13853;

//
// MessageId: ERROR_IPSEC_IKE_FAILQUERYSSP
//
// MessageText:
//
//  Failed to query Kerberos package to obtain max token size.
//
pub const ERROR_IPSEC_IKE_FAILQUERYSSP: i32 = 13854;

//
// MessageId: ERROR_IPSEC_IKE_SRVACQFAIL
//
// MessageText:
//
//  Failed to obtain Kerberos server credentials for ISAKMP/ERROR_IPSEC_IKE service.  Kerberos authentication will not function.  The most likely reason for this is lack of domain membership.  This is normal if your computer is a member of a workgroup.
//
pub const ERROR_IPSEC_IKE_SRVACQFAIL: i32 = 13855;

//
// MessageId: ERROR_IPSEC_IKE_SRVQUERYCRED
//
// MessageText:
//
//  Failed to determine SSPI principal name for ISAKMP/ERROR_IPSEC_IKE service (QueryCredentialsAttributes).
//
pub const ERROR_IPSEC_IKE_SRVQUERYCRED: i32 = 13856;

//
// MessageId: ERROR_IPSEC_IKE_GETSPIFAIL
//
// MessageText:
//
//  Failed to obtain new SPI for the inbound SA from Ipsec driver.  The most common cause for this is that the driver does not have the correct filter.  Check your policy to verify the filters.
//
pub const ERROR_IPSEC_IKE_GETSPIFAIL: i32 = 13857;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_FILTER
//
// MessageText:
//
//  Given filter is invalid
//
pub const ERROR_IPSEC_IKE_INVALID_FILTER: i32 = 13858;

//
// MessageId: ERROR_IPSEC_IKE_OUT_OF_MEMORY
//
// MessageText:
//
//  Memory allocation failed.
//
pub const ERROR_IPSEC_IKE_OUT_OF_MEMORY: i32 = 13859;

//
// MessageId: ERROR_IPSEC_IKE_ADD_UPDATE_KEY_FAILED
//
// MessageText:
//
//  Failed to add Security Association to IPSec Driver.  The most common cause for this is if the IKE negotiation took too long to complete.  If the problem persists, reduce the load on the faulting machine.
//
pub const ERROR_IPSEC_IKE_ADD_UPDATE_KEY_FAILED: i32 = 13860;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_POLICY
//
// MessageText:
//
//  Invalid policy
//
pub const ERROR_IPSEC_IKE_INVALID_POLICY: i32 = 13861;

//
// MessageId: ERROR_IPSEC_IKE_UNKNOWN_DOI
//
// MessageText:
//
//  Invalid DOI
//
pub const ERROR_IPSEC_IKE_UNKNOWN_DOI: i32 = 13862;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_SITUATION
//
// MessageText:
//
//  Invalid situation
//
pub const ERROR_IPSEC_IKE_INVALID_SITUATION: i32 = 13863;

//
// MessageId: ERROR_IPSEC_IKE_DH_FAILURE
//
// MessageText:
//
//  Diffie-Hellman failure
//
pub const ERROR_IPSEC_IKE_DH_FAILURE: i32 = 13864;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_GROUP
//
// MessageText:
//
//  Invalid Diffie-Hellman group
//
pub const ERROR_IPSEC_IKE_INVALID_GROUP: i32 = 13865;

//
// MessageId: ERROR_IPSEC_IKE_ENCRYPT
//
// MessageText:
//
//  Error encrypting payload
//
pub const ERROR_IPSEC_IKE_ENCRYPT: i32 = 13866;

//
// MessageId: ERROR_IPSEC_IKE_DECRYPT
//
// MessageText:
//
//  Error decrypting payload
//
pub const ERROR_IPSEC_IKE_DECRYPT: i32 = 13867;

//
// MessageId: ERROR_IPSEC_IKE_POLICY_MATCH
//
// MessageText:
//
//  Policy match error
//
pub const ERROR_IPSEC_IKE_POLICY_MATCH: i32 = 13868;

//
// MessageId: ERROR_IPSEC_IKE_UNSUPPORTED_ID
//
// MessageText:
//
//  Unsupported ID
//
pub const ERROR_IPSEC_IKE_UNSUPPORTED_ID: i32 = 13869;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_HASH
//
// MessageText:
//
//  Hash verification failed
//
pub const ERROR_IPSEC_IKE_INVALID_HASH: i32 = 13870;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_HASH_ALG
//
// MessageText:
//
//  Invalid hash algorithm
//
pub const ERROR_IPSEC_IKE_INVALID_HASH_ALG: i32 = 13871;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_HASH_SIZE
//
// MessageText:
//
//  Invalid hash size
//
pub const ERROR_IPSEC_IKE_INVALID_HASH_SIZE: i32 = 13872;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_ENCRYPT_ALG
//
// MessageText:
//
//  Invalid encryption algorithm
//
pub const ERROR_IPSEC_IKE_INVALID_ENCRYPT_ALG: i32 = 13873;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_AUTH_ALG
//
// MessageText:
//
//  Invalid authentication algorithm
//
pub const ERROR_IPSEC_IKE_INVALID_AUTH_ALG: i32 = 13874;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_SIG
//
// MessageText:
//
//  Invalid certificate signature
//
pub const ERROR_IPSEC_IKE_INVALID_SIG: i32 = 13875;

//
// MessageId: ERROR_IPSEC_IKE_LOAD_FAILED
//
// MessageText:
//
//  Load failed
//
pub const ERROR_IPSEC_IKE_LOAD_FAILED: i32 = 13876;

//
// MessageId: ERROR_IPSEC_IKE_RPC_DELETE
//
// MessageText:
//
//  Deleted via RPC call
//
pub const ERROR_IPSEC_IKE_RPC_DELETE: i32 = 13877;

//
// MessageId: ERROR_IPSEC_IKE_BENIGN_REINIT
//
// MessageText:
//
//  Temporary state created to perform reinit. This is not a real failure.
//
pub const ERROR_IPSEC_IKE_BENIGN_REINIT: i32 = 13878;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_RESPONDER_LIFETIME_NOTIFY
//
// MessageText:
//
//  The lifetime value received in the Responder Lifetime Notify is below the Windows 2000 configured minimum value.  Please fix the policy on the peer machine.
//
pub const ERROR_IPSEC_IKE_INVALID_RESPONDER_LIFETIME_NOTIFY: i32 = 13879;

//
// MessageId: ERROR_IPSEC_IKE_INVALID_CERT_KEYLEN
//
// MessageText:
//
//  Key length in certificate is too small for configured security requirements.
//
pub const ERROR_IPSEC_IKE_INVALID_CERT_KEYLEN: i32 = 13881;

//
// MessageId: ERROR_IPSEC_IKE_MM_LIMIT
//
// MessageText:
//
//  Max number of established MM SAs to peer exceeded.
//
pub const ERROR_IPSEC_IKE_MM_LIMIT: i32 = 13882;

//
// MessageId: ERROR_IPSEC_IKE_NEGOTIATION_DISABLED
//
// MessageText:
//
//  IKE received a policy that disables negotiation.
//
pub const ERROR_IPSEC_IKE_NEGOTIATION_DISABLED: i32 = 13883;

//
// MessageId: ERROR_IPSEC_IKE_NEG_STATUS_END
//
// MessageText:
//
//  ERROR_IPSEC_IKE_NEG_STATUS_END
//
pub const ERROR_IPSEC_IKE_NEG_STATUS_END: i32 = 13884;
