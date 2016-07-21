import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import d3Chart from './d3chart';
import models from './models';

var CirclesPage = React.createClass({
  getDefaultProps() {
    return {
      domain: {x: [0, 100], y: [0, 100]}
    };
  },
  componentDidMount() {
    var circles = new models.Circles();
    circles.fetch()
      .then(() => {
        this.updateCircles(circles);
      });
  },
  updateCircles(circles) {
    return this.setState({circles});
  },
  render() {
    if (!this.state) return null;
    var {domain} = this.props;
    var {circles} = this.state;
    return (
      <div className='circles-page'>
        <h2>Circles</h2>
        <div className='circles-chart'>
          <Chart domain={domain} circles={circles} />
        </div>
        <CirclesDataTable domain={domain} circles={circles} updateCircles={this.updateCircles} />
      </div>
    );
  }
});

var Chart = React.createClass({
  getDefaultProps() {
    return {
      width: '100%',
      height: '500px'
    };
  },
  dispatcher: null,
  componentDidMount() {
    var {circles, domain, width, height} = this.props;
    this.dispatcher = d3Chart.create(
      ReactDOM.findDOMNode(this), {width, height}, {domain, data: circles.toJSON()}
    );
  },
  componentDidUpdate() {
    var {circles, domain} = this.props;
    d3Chart.update(
      ReactDOM.findDOMNode(this), {domain, data: circles.toJSON()}, this.dispatcher
    );
  },
  render() {
    return <div className='chart' />;
  }
});

var CirclesDataTable = React.createClass({
  getInitialState() {
    return {
      circle: new models.Circle({
        x: 0,
        y: 0,
        r: 5
      })
    };
  },
  render() {
    var {circles} = this.props;
    var errors = this.state.circle.validationError;
    return (
      <div className='circles-control'>
        <h4>You can add up to 5 circles. Use x/y coordinates of circle center and its radius to add the shape.</h4>
        {circles.map(this.renderCircleData)}
        {circles.length < 5 &&
          this.renderNewCircleForm()
        }
        {!_.isEmpty(errors) &&
          <ul className='error'>
            {_.map(errors, (error, key) =>
              <li key={key}>{error}</li>)
            }
          </ul>
        }
      </div>
    );
  },
  renderCircleData(circle, index) {
    return <div className='circles-controls' key={index}>
      <span>{index + 1}.  </span>
      <div>
        <label>x:</label> {circle.get('x')};
      </div>
      <div>
        <label>y:</label> {circle.get('y')};
      </div>
      <div>
        <label>radius:</label> {circle.get('r')};
      </div>
      <div>
        <button onClick={_.partial(this.removeCircle, circle.id)}>
          Remove
        </button>
      </div>
    </div>;
  },
  renderNewCircleForm() {
    var {circle} = this.state;
    var errors = circle.validationError;
    return <div className='circles-controls'>
      <span>&nbsp;</span>
      {_.map(circle.attributes, (value, key) =>
        <div key={key}>
          <label>{key === 'r' ? 'radius' : key}: </label>
          <input className={errors && errors[key] && 'input-error'} type='number' name={key} min='0' max='100' onChange={this.onChange} value={value} />
        </div>
      )}
      <div>
        <button onClick={this.addCircle} disabled={!_.isEmpty(errors)}>Add Circle</button>
      </div>
    </div>;
  },
  addCircle() {
    var {circle} = this.state;
    var {circles, updateCircles} = this.props;

    circles.add(circle);
    circle.save(null, {validate: false});
    updateCircles(circles);
    this.setState({
      circle: new models.Circle({
        x: 0,
        y: 0,
        r: 5
      })
    });
  },
  removeCircle(circleId) {
    var {circles, updateCircles} = this.props;
    circles.get(circleId).destroy();
    updateCircles(circles);
  },
  onChange(e) {
    var {circle} = this.state;
    var {circles, domain} = this.props;
    var {name, value} = e.target;

    var xMax = domain.x[1];
    var radiusMax = xMax - circles.reduce((result, circle) => result + Number(circle.get('r')), 0);
    circle.set({[name]: value}, {validate: true, radiusMax, xMax, yMax: domain.y[1]});
    this.forceUpdate();
  }
});

export default CirclesPage;