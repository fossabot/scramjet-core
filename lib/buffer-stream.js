const scramjet = require(".");

/**
 * A factilitation stream created for easy splitting or parsing buffers.
 *
 * Useful for working on built-in Node.js streams from files, parsing binary formats etc.
 *
 * A simple use case would be:
 *
 * ```javascript
 *  fs.createReadStream('pixels.rgba')
 *      .pipe(new BufferStream)         // pipe a buffer stream into scramjet
 *      .breakup(4)                     // split into 4 byte fragments
 *      .parse(buf => [
 *          buf.readInt8(0),            // the output is a stream of R,G,B and Alpha
 *          buf.readInt8(1),            // values from 0-255 in an array.
 *          buf.readInt8(2),
 *          buf.readInt8(3)
 *      ]);
 * ```
 *
 * @borrows BufferStream#stringify as BufferStream#toStringStream
 * @borrows BufferStream#shift as BufferStream#pop
 * @borrows BufferStream#parse as BufferStream#toDataStream
 * @extends DataStream
 */
class BufferStream extends scramjet.DataStream {

    /**
     * Creates the BufferStream
     *
     * @param {object} opts Stream options passed to superclass
     * @example {@link ../samples/buffer-stream-constructor.js}
     */
    constructor(...args) {
        super(...args);
        this.buffer = [];
    }

    /**
     * Shift callback
     *
     * @callback ShiftCallback
     * @param {Buffer} shifted shifted bytes
     */

    /**
     * Shift given number of bytes from the original stream
     *
     * Works the same way as {@see DataStream.shift}, but in this case extracts
     * the given number of bytes.
     *
     * @chainable
     * @param {Number} chars The number of bytes to shift
     * @param {ShiftCallback} func Function that receives a string of shifted bytes
     * @return {BufferStream} substream
     *
     * @example {@link ../samples/string-stream-shift.js}
     */
    shift(bytes, func) {
        const ret = Buffer.alloc(bytes);
        const str = this.tap()._selfInstance();
        let offs = 0;

        const chunkHandler = (chunk) => {
            const length = Math.min(ret.length - offs, chunk.length);
            chunk.copy(ret, offs, 0, length);
            offs += length;
            if (length >= bytes) {
                unHook()
                    .then(
                        () => {
                            str.write(chunk.slice(length));
                            this.pipe(str);
                        }
                    );
            }
        };

        const endHandler = (...args) => {
            if (ret.length < bytes) {
                unHook();
            }
            str.end(...args);
        };

        const errorHandler = str.emit.bind(str, "error");

        const unHook = (async () => {
            this.removeListener("data", chunkHandler);
            this.removeListener("end", endHandler);
            this.removeListener("error", errorHandler);
            return func(ret);
        });


        this.on("data", chunkHandler);
        this.on("end", endHandler);
        this.on("error", errorHandler);

        return str;
    }

    /**
     * Splits the buffer stream into buffer objects
     *
     * @chainable
     * @param  {String|Buffer} splitter the buffer or string that the stream
     *                                  should be split by.
     * @return {BufferStream}  the re-split buffer stream.
     * @example {@link ../samples/buffer-stream-split.js}
     */
    split(splitter) {
        if (splitter instanceof Buffer || typeof splitter === "string") {
            const needle = Buffer.from(splitter);
            return this.tap().pipe(this._selfInstance({
                transform(buffer, enc, callback) {
                    if (Buffer.isBuffer(this._haystack) && this._haystack.length > 0) {
                        this._haystack = Buffer.from([this._haystack, buffer]);
                    } else {
                        this._haystack = buffer;
                    }

                    let pos;
                    while((pos = this._haystack.indexOf(needle)) > -1) {
                        this.push(Buffer.from(this._haystack.slice(0, pos)));
                        this._haystack = this._haystack.slice(pos + needle.length);
                    }

                    callback();
                },
                flush(callback) {
                    if (this._haystack.length) this.push(this._haystack);
                    this._haystack = null;
                    callback();
                }
            }));
        }
    }

    /**
     * Breaks up a stream apart into chunks of the specified length
     *
     * @chainable
     * @param  {Number} number the desired chunk length
     * @return {BufferStream}  the resulting buffer stream.
     * @example {@link ../samples/buffer-stream-breakup.js}
     */
    breakup(number) {
        if (number <= 0 || !isFinite(+number))
            throw new Error("Breakup number is invalid - must be a positive, finite integer.");

        return this.tap().pipe(this._selfInstance({
            transform(chunk, encoding, callback) {
                if (Buffer.isBuffer(this.buffer)) {
                    chunk = Buffer.concat([this.buffer, chunk]);
                }
                let offset;
                for (offset = 0; offset < chunk.length - number; offset += number) {
                    this.push(chunk.slice(offset, offset + number));
                }
                this.buffer = chunk.slice(offset);
                callback();
            },
            flush(callback) {
                this.push(this.buffer);
                this.buffer = null;
                callback();
            }
        }));

    }

    /**
     * Creates a string stream from the given buffer stream
     *
     * Still it returns a DataStream derivative and isn't the typical node.js
     * stream so you can do all your transforms when you like.
     *
     * @param  {String} encoding The encoding to be used to convert the buffers
     *                           to streams.
     * @return {StringStream}  The converted stream.
     * @example {@link ../samples/buffer-stream-tostringstream.js}
     */
    stringify(encoding) {
        return this.pipe(new scramjet.StringStream(encoding || "utf-8", {objectMode: true}));
    }

    /**
     * Alias for {@link BufferStream#stringify}
     * @method toStringStream
     * @memberof StringStream#
     */

    /**
     * @callback ParseCallback
     * @param {Buffer} chunk the transformed chunk
     * @return {Promise}  the promise should be resolved with the parsed object
     */

    /**
     * Parses every buffer to object
     *
     * The method MUST parse EVERY buffer into a single object, so the buffer
     * stream here should already be split or broken up.
     *
     * @param  {ParseCallback} parser The transform function
     * @return {DataStream}  The parsed objects stream.
     * @example {@link ../samples/buffer-stream-parse.js}
     */
    parse(parser) {
        return this.tap().map(parser, scramjet.DataStream);
    }

    /**
     * @meta.noReadme
     * @ignore
     */
    _transform(chunk, encoding, callback) {
        this.push(Buffer.from(chunk, encoding));
        return callback();
    }

    /**
     * Create BufferStream from anything.
     *
     * @see module:scramjet.from
     *
     * @param {Array|Iterable|AsyncGeneratorFunction|GeneratorFunction|AsyncFunction|Function|Readable} str argument to be turned into new stream
     * @param {StreamOptions|Writable} options
     * @return {BufferStream}          new StringStream.
     */
    static from(...args) {
        return scramjet.DataStream.from.call(this, ...args);
    }

}

BufferStream.prototype.pop = BufferStream.prototype.shift;
BufferStream.prototype.toDataStream = BufferStream.prototype.parse;
BufferStream.prototype.toStringStream = BufferStream.prototype.stringify;

module.exports = BufferStream;
