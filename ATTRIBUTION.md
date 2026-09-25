# Attribution

This library is an independent, from-scratch implementation. It is **not** a fork of
any existing package, but its HTML vocabulary is deliberately compatible with
[`@skyra/discord-components-core`](https://github.com/skyra-project/discord-components)
(MIT), which this project's tag names and attribute names follow so that existing
knowledge, examples, and documentation transfer, and so a future parser can target a
familiar surface.

The following were informed by that upstream project:

- the set of custom element names (`discord-messages`, `discord-message`, `discord-embed`, …);
- attribute naming conventions (for example `author`, `avatar`, `role-color`, `compact-mode`);
- the general geometry of Discord's chat UI, used as a reference while hand-writing the stylesheet.

Upstream licence notice, reproduced as required:

```
MIT License

Copyright (c) 2021 Skyra

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

No source code or stylesheet text is copied from that project. Discord is a trademark
of Discord Inc.; this project is unaffiliated with Discord and with Skyra.
