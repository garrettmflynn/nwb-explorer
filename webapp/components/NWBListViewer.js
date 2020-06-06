import React, { Component } from 'react';
import ListViewer from 'geppetto-client/js/components/interface/listViewer/ListViewer';
import listViewerConf from './configuration/listViewerConfiguration.js';

const DEFAULT_MODEL_SETTINGS = { color: 'white' };
const TYPE_INCLUDE_REGEX = /^(?!.*details)Model.nwbfile.*$/;


export default class NWBListViewer extends Component {

  constructor (props) {
    super(props);
    this.updates = 0;
    this.showPlot = this.props.showPlot ? this.props.showPlot : () => console.debug('showPlot not defined in ' + typeof this);
    this.addToPlot = props.addToPlot ? props.addToPlot : () => console.debug('addToPlot not defined in ' + typeof this);
    this.showImageSeries = props.showImg ? props.showImg : () => console.debug('showImg not defined in ' + typeof this);
    this.updateDetailsWidget = this.props.updateDetailsWidget ? this.props.updateDetailsWidget : () => console.debug('updateDetailsWidget not defined in ' + typeof this);
    this.plotAllInstances = this.plotAllInstances.bind(this);
    this.plotAll = this.props.plotAll ? this.props.plotAll : () => console.debug('plotAll not defined in ' + typeof this);
    this.modelSettings = {};
    this.state = { update: 0 }
    this.filter = this.props.filter ? this.props.filter.bind(this) : this.filter.bind(this);
  }

  componentDidUpdate () {
    this.updates++;
  }
  getModelSettings (path) {
    return this.modelSettings[path] ? this.modelSettings[path] : DEFAULT_MODEL_SETTINGS;
  }

  mapModelPathToList (path) {
    const instance = Instances.getInstance(path);
    let description;
    let type;
    try {
      let description_instance = Instances.getInstance(path + '.description');
      description = description_instance ? description_instance.getValue().wrappedObj.value.text : '-';
    } catch (Error) {
      description = "Not yet supported.";
      console.debug('Description error');
    }

    try {
      type = instance.getType().getName();
    } catch (Error) {
      type = '(Unsupported)';
      console.debug('Type error');
    }

    return {
      path,
      type: type,
      description: description ? description : '-',
      ...this.getModelSettings(path)
    }
  }

  clickShowPlot ({ path, color, title }) {
    this.modelSettings[path] = { color: color };
    this.setState({ update: this.state.update + 1 });
    this.showPlot({ path, color, title });
  }

  clickShowImg ({ path }) {
    this.showImageSeries({ path });
  }

  clickShowDetails ({ path }) {
    this.updateDetailsWidget(path)
  }

  clickAddToPlot (props) {
    this.addToPlot(props)
  }
  
  plotAllInstances () {    
    let instances = this.getInstances();
    let plotCreated = false;
    let firstPlot = null;
    let plots = new Array();
    for ( var i = 0; i < instances.length; i++ ) {
      if ( instances[i].type === "TimeSeries" ){
        if ( plotCreated ) {
          plots.push( { instancePath : instances[i].path, color : instances[i].color , hostId : "plot@" + firstPlot , type : "ADD_PLOT_TO_EXISTING_WIDGET" } );
        } else {
          plots.push( { instancePath : instances[i].path, color : instances[i].color, type : "ADD_WIDGET" } );
          plotCreated = true;
          firstPlot = instances[i].path;
        }
      }
    }
    this.plotAll({ plots : plots, title : "All Matching Instances" } );
  }

  filter (pathObj) {
    const { path, type } = pathObj;
    const { pathPattern, typePattern } = this.props;

    if (type.match(TYPE_INCLUDE_REGEX)) {
      if (path.match(pathPattern)) {
        let instance = Instances.getInstance(path);
        if (instance.getPath) {
          return instance.getType().getName().match(typePattern);
        }


      }
    }

    return false

  }

  getInstances () {
    return GEPPETTO.ModelFactory.allPaths.
      filter(this.filter)
      .map(({ path }) => this.mapModelPathToList(path));
  }

  getColumnConfiguration () {
    return listViewerConf;
  }

  render () {
    let instances = this.getInstances();
    
    return <div>
      <ListViewer
        columnConfiguration={this.getColumnConfiguration()}
        instances={instances}
        handler={this}
        infiniteScroll={true}
        update={this.state.update} 
        headingComponent ={
          <div>
            { instances .length > 0
              ? <span>{instances.length} Matching Results</span>
              : null
            }
            <span style={{ float : "right" , marginRight : "5vh" }} className="fa fa-area-chart list-icon" onClick={this.plotAllInstances} />
          </div>
        }/>
    </div>


  }


}

