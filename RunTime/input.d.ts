/* File: Input.d.ts
 * Author: Rhuan
 * Date: 13/07/2018
 * TS typings for input.mjs see input.mjs for more details
 * License for input.mjs
 * Copyright (c) 2017 Richard Lawrence (Rhuan)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * Except as contained in this notice, the name(s) of the above copyright holders
 * shall not be used in advertising or otherwise to promote the sale, use or other
 * dealings in this Software without prior written authorization.
 */

 /// <reference path="../SphereV2.d.ts" />

import Focus from "focus-target";

export default class Input
{
    constructor(priority?: number)

    private state : number
    private value : number
    private focus : Focus

    /**
     * Get a string representing the provided key
     */
    static getChar(key : Key, shifted?: boolean) : string

    /**
     * Dispose of this Input
     */
    disposeInput() : void

    /**
     * Ask to start recieving input
     * Won't succeed if there is a higher priority input ahead in the queue
     */
    takeInput() : void

    yieldInput() : void

    /**
     * Clear any pending key presses no-op if don't currently have focus
     */
    clearQueue() : void

    /**
     * getKey - returns null if no key pressed or if don't have focus
     */
    getKey() : Key | null

    /**
     * true if specified key pressed AND thisinput has focus otherwise false
     */
    isPressed(key : Key) : boolean


    /**
     * Promise that resolves when specified key is pressed AND at front of queue
     */
    waitForKey(key : Key, allowContinuous?: boolean) : Promise<number>

    /**
     * Promise that resolves when one of the specified keys is pressed and at front of queue
     */
    waitForInput(keys : Key[], allowContinuous?: boolean) : Promise<number>

    /**
     * Promise that resolves with the next key pressed and at front of queue
     */
    getNextKey(clearQueue?: boolean, permittedKeys?: Key[]) : Promise<number>

    /**
     * Promise that resolves on reaching the front of the input queue
     * Parameter specfies whether you should ask for focus
     *
     * @param {boolean} askForIt - defaults to true
     */
    waitForPriority(askForIt?: boolean) : Promise<boolean>
}




