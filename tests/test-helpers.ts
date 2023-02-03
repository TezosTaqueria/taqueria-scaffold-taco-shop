/*
  Small test helpers.

  Please see the top - level README file for more information.

  Copyright (c) 2023 ECAD Labs. All rights reserved.
  This software is licensed under the terms of the included LICENSE file.
*/

export const log = (s: string) => console.log(s);
export const err = (s: string) => console.error(s);
export const warn = (s: string) => console.warn(s);

export const stringify = (s: any) => JSON.stringify(s);

import { CustomConsole, LogType, LogMessage } from '@jest/console';

// Improve `jest` output: do not print "origin line" metadata when logging
// Adapted from https://stackoverflow.com/questions/51555568/remove-logging-the-origin-line-in-jest
function removeOriginLineFormatter(type: LogType, message: LogMessage): string {
    const TITLE_INDENT = '    ';
    const CONSOLE_INDENT = TITLE_INDENT + '  ';
    return message.split(/\n/).map(line => CONSOLE_INDENT + line + '\n').join("\n");
}

global.console = new CustomConsole(process.stdout, process.stderr, removeOriginLineFormatter)
