var glob = require('glob');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');

exports.map = function (src, dest)
{
  var promise = new Promise((resolve, reject) => {
    src = src || 'svg/**/*.svg';
    dest = dest || './map.svg';

    //console.log(`ok src is ${src}, dest is ${dest}`);

    glob(src, (error, fileNames) => {
      var holderTemplate = fs.readFileSync(require.resolve('./holder-template.svg')).toString();
      var symbolTemplate = fs.readFileSync(require.resolve('./symbol-template.svg')).toString();

      var svgParser = /<svg([\s\S]*?)>.*$([\s\S]*)<\/svg>/mi;

      var symbols = [];
      var foundFilesNumber = 0;
      fileNames.forEach(fileName => {
        foundFilesNumber += 1;
        var file = fs.readFileSync(fileName).toString();
        var result = svgParser.exec(file);
        var attributes = result[1];
        var content = result[2];

        var fileNameNoExtension = fileName.replace(/(.*[\/\\])?(.*)(\..*)/, '$2');

        //replacing id attribute
        attributes = attributes.replace(/id=".*?"/, '');
        attributes = `id="${fileNameNoExtension}"${attributes}`;

        //adding attributes and content to svg
        var symbol = symbolTemplate.replace(/\n?\{\{attributes\}\}\n?/, attributes);
        symbol = symbol.replace(/\n?\{\{content\}\}\n?/m, content);

        //adding indentation (2 spaces)
        symbol = symbol.replace(/^(.+)/gm, '  $1');

        symbols.push(symbol);
      });

      if (foundFilesNumber > 0)
      {
        console.log(`svg-mapper : processed ${foundFilesNumber} files`);
      }
      else {
        console.log('svg-mapper : error, no files found');
      }

      var output = holderTemplate.replace(/\{\{symbols\}\}/, symbols.join('\n'));

      //console.log(output);
      mkdirp(path.dirname(dest), function (error) {
        if (error) { reject(error); }
        else {
          fs.writeFile(dest, output, error => {
            if (error) { reject(error); }
            resolve();
          });
        }
      });
    });
  });

  return promise;
};
