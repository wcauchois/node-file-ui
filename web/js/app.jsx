
function fileExtension(name) {
  var extMatch = name.match(/\.[a-z]+$/);
  if (extMatch) {
    return extMatch[0].substring(1);
  } else {
    return '';
  }
}

var FileRow = React.createClass({
  render: function() {
    var href = "";

    if (this.props.file.type === "directory") {
      href = "#/dir" + this.props.file.fullPath;
    } else if (this.props.file.type === "file") {
      if (_.has(codeFileExtMap, fileExtension(this.props.file.name))) {
        href = "#/code" + this.props.file.fullPath;
      } else {
        href = "raw" + this.props.file.fullPath;
      }
    }

    return (
      <tr>
        <td>
          <a href={href}>{this.props.file.name}</a>
        </td>
        <td>{this.props.file.type}</td>
      </tr>
    );
  }
});

var FileList = React.createClass({
  render: function() {
    return (
      <table className="u-full-width">
        <thead>
        </thead>
        <tbody>
          <tr>
            <td colSpan="2">
              <span className="upArrow">&crarr;</span>
              &nbsp;
              <a href={"#/dir" + this.props.parentDir}>
                Up one level
              </a>
            </td>
          </tr>
          {this.props.files.map(function(file) {
            return <FileRow file={file} key={file.index} />
          })}
        </tbody>
      </table>
    )
  }
});

var codeFileExtMap = {
  'js': 'javascript',
  'py': 'python',
  'c': 'c',
  'scala': 'scala',
  'json': 'json',
  'jsx': 'jsx',
  'less': 'css',
  'css': 'css'
};

var CodeViewer = React.createClass({
  render: function() {
    return (
      <div class="u-full-width">
        <pre className={codeFileExtMap[fileExtension(this.props.fileName)]}>
          {this.props.code}
        </pre>
      </div>
    );
  },

  componentDidMount: function() {
    var domNode = React.findDOMNode(this);
    hljs.highlightBlock(domNode.getElementsByTagName('pre')[0]);
  }
});

function renderDirectory(dirName) {
  return Promise.resolve(
    $.getJSON('/files.json', {dir: dirName})
  ).then(function(response) {
    React.render(
      <FileList files={response.files} parentDir={response.parentDir} dirName={dirName} />,
      document.getElementById('container')
    );
  });
}

var router = new Router();

router.on('/', function() {
  renderDirectory('/');
});

router.on(/\/dir\/(.*)/, function(dirNameNoLeadingSlash) {
  var dirName = '/' + dirNameNoLeadingSlash;
  renderDirectory(dirName);
});

router.on(/\/code\/(.*)/, function(fileName) {
  Promise.resolve(
    $.get('raw/' + fileName + '?plain=true')
  ).then(function(fileContents) {
    React.render(
      <CodeViewer code={fileContents} fileName={fileName} />,
      document.getElementById('container')
    )
  });
});

router.init('/');

