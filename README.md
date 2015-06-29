# FarmPi

A weekend gardening project I designed for a small greenhouse in Reykjalundur, Iceland, farmed by <a href="https://www.facebook.com/nick.robinson.1829405?fref=ts">Nick Robinson</a>. Growing squash in Iceland seems to be tough so he wanted constant temperature measurement in soil and air.

The sensors used are <a href="https://www.adafruit.com/products/381">ds18b20</a>.

See <a href="http://farmpi.nonni.cc">DEMO</a> (note: the demo is generating random numbers since we´re using the Pi in the greenhouse :-)


## Installation

clone the repo

npm install

bower install

npm start

## To start on boot

sudo npm install -g forever

cd your-project

sudo forever start your-app-name.js

## Usage

You can read temperatures within a selected date range. 

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Credits

<a href="http://www.chartjs.org/">Chart.js</a>

<a href="http://getbootstrap.com/">Bootstrap</a>

<a href="https://github.com/dangrossman/bootstrap-daterangepicker">DateRangePicker</a>

<a href="https://www.raspberrypi.org/">RPi</a>

<a href="https://nodejs.org/">NodeJS</a>

## License

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org>
