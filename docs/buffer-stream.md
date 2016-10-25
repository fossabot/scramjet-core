<a name="BufferStream"></a>

## BufferStream ⇐ <code>DataStream</code>
A factilitation stream created for easy splitting or parsing a buffer

**Kind**: global class  
**Extends:** <code>DataStream</code>  

* [BufferStream](#BufferStream) ⇐ <code>DataStream</code>
    * [.split(splitter)](#BufferStream+split) ⇒ <code>[BufferStream](#BufferStream)</code>
    * [.toStringStream(encoding)](#BufferStream+toStringStream) ⇒ <code>StringStream</code>
    * [.parse(parser)](#BufferStream+parse) ⇒ <code>DataStream</code>
    * [.tee(func)](#BufferStream+tee) ⇒ <code>[BufferStream](#BufferStream)</code>

<a name="BufferStream+split"></a>

### bufferStream.split(splitter) ⇒ <code>[BufferStream](#BufferStream)</code>
Splits the buffer stream into buffer objects according to the passed

**Kind**: instance method of <code>[BufferStream](#BufferStream)</code>  
**Returns**: <code>[BufferStream](#BufferStream)</code> - the re-splitted buffer stream.  
**Todo**

- [ ] implement splitting by buffer or string


| Param | Type | Description |
| --- | --- | --- |
| splitter | <code>function</code> | A function that will be called for every                             stream chunk. |

<a name="BufferStream+toStringStream"></a>

### bufferStream.toStringStream(encoding) ⇒ <code>StringStream</code>
Creates a string stream from the given buffer stream. Still it returns a

**Kind**: instance method of <code>[BufferStream](#BufferStream)</code>  
**Returns**: <code>StringStream</code> - The converted stream.  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | The encoding to be used to convert the buffers                           to streams. |

<a name="BufferStream+parse"></a>

### bufferStream.parse(parser) ⇒ <code>DataStream</code>
Parses every buffer to object. The method MUST parse EVERY buffer into a

**Kind**: instance method of <code>[BufferStream](#BufferStream)</code>  
**Returns**: <code>DataStream</code> - The parsed objects stream.  

| Param | Type | Description |
| --- | --- | --- |
| parser | <code>TransformFunction</code> | The transform function |

<a name="BufferStream+tee"></a>

### bufferStream.tee(func) ⇒ <code>[BufferStream](#BufferStream)</code>
Duplicate the stream and pass the duplicate to the passed callback

**Kind**: instance method of <code>[BufferStream](#BufferStream)</code>  
**Returns**: <code>[BufferStream](#BufferStream)</code> - self  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>TransformFunction</code> | The duplicate stream will be passed as                                  first argument. |
