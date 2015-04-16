
var FileRow = React.createClass({
  render: function() {
    return (
      <tr>
        <td>
          <a href={"#" + this.props.file.fullPath}>
            {this.props.file.name}
          </a>
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
              <a href={"#" + this.props.parentDir}>
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

var FileHeader = React.createClass({
  render: function() {
    return (
      <div className="fileHeader">
        <div className="u-pull-left">
          <span>&#8592;</span> <a href={"#" + this.props.parentDir}>Go back</a>
        </div>
        <div className="u-pull-right">
          <a href={"raw" + this.props.fullPath}>View raw</a>
        </div>
      </div>
    );
  }
});

var TextViewer = React.createClass({
  render: function() {
    return (
      <div>
        <FileHeader parentDir={this.props.parentDir} fullPath={this.props.fullPath} />
        <div className="u-full-width">
          <pre className={this.props.highlightClass || ''}>
            {this.props.fileContents}
          </pre>
        </div>
      </div>
    );
  },

  componentDidMount: function() {
    if (this.props.highlightClass) {
      var domNode = React.findDOMNode(this);
      hljs.highlightBlock(domNode.getElementsByTagName('pre')[0]);
    }
  }
});

var ShowMarkdown = React.createClass({
  render: function() {
    return (
      <div>
        <FileHeader parentDir={this.props.parentDir} fullPath={this.props.fullPath} />
        <div className="renderArea"></div>
      </div>
    );
  },

  componentDidMount: function() {
    var converter = new Showdown.converter();
    var html = converter.makeHtml(this.props.fileContents);
    $(React.findDOMNode(this)).find('.renderArea').html(html);
  }
});

var ImageViewer = React.createClass({
  render: function() {
    return (
      <div className="u-full-width">
        <FileHeader parentDir={this.props.parentDir} fullPath={this.props.fullPath} />
        <div className="imageContainer">
          <img src={'raw' + this.props.fullPath} />
        </div>
      </div>
    );
  }
});

var router = new Router();

router.on('/(.*)', function(rawPath) {
  var path = '/' + rawPath;
  Promise.resolve(
    $.getJSON('resolve.json', {path: path})
  ).then(function(response) {
    var component;
    if (response.type === 'directory') {
      component = FileList;
    } else if (response.type === 'text') {
      component = TextViewer;
    } else if (response.type === 'markdown') {
      component = ShowMarkdown;
    } else if (response.type === 'image') {
      component = ImageViewer;
    }

    if (component) {
      React.render(
        React.createElement(component, response),
        document.getElementById('container')
      );
    } else {
      window.location.replace('raw' + path);
    }
  });
});

router.init('/');

