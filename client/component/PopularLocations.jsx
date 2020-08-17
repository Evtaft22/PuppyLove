import React, { Component } from 'react';
import Geocode from 'react-geocode';
import { withGoogleMap, GoogleMap, withScriptjs, InfoWindow, Marker } from "react-google-maps";
import Autocomplete from 'react-google-autocomplete';
import { API_KEY } from '../config.js';
import axios from 'axios';
Geocode.setApiKey( "AIzaSyAIShYGz5mXtO2XtWhaOHlrmDz33fKCnmE" );
Geocode.enableDebug();

class PopularLocations extends Component {
  constructor(props) {
    super(props);

    this.state = {
      clicked: false,
      places: [],
      address: '',
			city: '',
			area: '',
			state: '',
			mapPosition: {
				lat: this.props.center.lat,
				lng: this.props.center.lng
			},
			markerPosition: {
				lat: this.props.center.lat,
				lng: this.props.center.lng
			}
    }
    this.displayForm = this.displayForm.bind(this);
    this.addLoc = this.addLoc.bind(this);
    this.getCity = this.getCity.bind(this);
		this.getArea = this.getArea.bind(this);
		this.getState = this.getState.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onInfoWindowClose = this.onInfoWindowClose.bind(this);
		this.onMarkerDragEnd = this.onMarkerDragEnd.bind(this);
		this.onPlaceSelected = this.onPlaceSelected.bind(this);
  };

  componentDidount() {
    axios.get('/loc')
    .then(response => {
      return response.data.map(place => {
        return (
          <li id='locbox' style={{ fontSize: '20px', margin: '0 0 40px 100px', display: 'inline-block' }}>
            <img src={place.image_url} />
            <div>Name: {place.location_name}</div>
            <div>Desc: {place.description}</div>
          </li>
        );
      });
    })
    .then(locList => this.setState({ places: locList }))
    .then(() => console.log('Here are your locations'))
    .catch(err => console.error('could not get locations ', err));
  }

  componentDidMount() {
		Geocode.fromLatLng( this.state.mapPosition.lat , this.state.mapPosition.lng ).then(
			response => {
				const address = response.results[0].formatted_address,
				      addressArray =  response.results[0].address_components,
				      city = this.getCity( addressArray ),
				      area = this.getArea( addressArray ),
				      state = this.getState( addressArray );

				console.log( 'city', city, area, state );

				this.setState( {
					address: ( address ) ? address : '',
					area: ( area ) ? area : '',
					city: ( city ) ? city : '',
					state: ( state ) ? state : '',
				} )
			},
			error => {
				console.error( error );
			}
		);
	};
	/**
	 * Component should only update ( meaning re-render ), when the user selects the address, or drags the pin
	 *
	 * @param nextProps
	 * @param nextState
	 * @return {boolean}
	 */
	shouldComponentUpdate( nextProps, nextState ){
		if (
			this.state.markerPosition.lat !== this.props.center.lat ||
			this.state.address !== nextState.address ||
			this.state.city !== nextState.city ||
			this.state.area !== nextState.area ||
			this.state.state !== nextState.state
		) {
			return true
		} else if ( this.props.center.lat === nextProps.center.lat ){
			return false
		}
  }

  addLoc() {
    axios.post('/loc', {
      location_name: document.getElementById('name').value,
      latitude: this.state.mapPosition.lat,
      longitude: this.state.mapPosition.lng,
      description: document.getElementById('desc').value,
      image_url: document.getElementById('image').value,
    })
    .then(() => this.setState({ clicked: false }))
    .catch((err) => console.info('could not send this location info ', err));
  };

  displayForm() {
    this.setState({ clicked: true });
  }

	/**
	 * Get the city and set the city input value to the one selected
	 *
	 * @param addressArray
	 * @return {string}
	 */
	getCity( addressArray ) {
		let city = '';
		for( let i = 0; i < addressArray.length; i++ ) {
			if ( addressArray[ i ].types[0] && 'administrative_area_level_2' === addressArray[ i ].types[0] ) {
				city = addressArray[ i ].long_name;
				return city;
			}
		}
	};
	/**
	 * Get the area and set the area input value to the one selected
	 *
	 * @param addressArray
	 * @return {string}
	 */
	getArea( addressArray ) {
		let area = '';
		for( let i = 0; i < addressArray.length; i++ ) {
			if ( addressArray[ i ].types[0]  ) {
				for ( let j = 0; j < addressArray[ i ].types.length; j++ ) {
					if ( 'sublocality_level_1' === addressArray[ i ].types[j] || 'locality' === addressArray[ i ].types[j] ) {
						area = addressArray[ i ].long_name;
						return area;
					}
				}
			}
		}
	};
	/**
	 * Get the address and set the address input value to the one selected
	 *
	 * @param addressArray
	 * @return {string}
	 */
	getState( addressArray ) {
		let state = '';
		for( let i = 0; i < addressArray.length; i++ ) {
			for( let i = 0; i < addressArray.length; i++ ) {
				if ( addressArray[ i ].types[0] && 'administrative_area_level_1' === addressArray[ i ].types[0] ) {
					state = addressArray[ i ].long_name;
					return state;
				}
			}
		}
	};
	/**
	 * And function for city,state and address input
	 * @param event
	 */
	onChange( event ) {
		this.setState({ [event.target.name]: event.target.value });
	};
	/**
	 * This Event triggers when the marker window is closed
	 *
	 * @param event
	 */
	onInfoWindowClose( event ) {

	};

	/**
	 * When the marker is dragged you get the lat and long using the functions available from event object.
	 * Use geocode to get the address, city, area and state from the lat and lng positions.
	 * And then set those values in the state.
	 *
	 * @param event
	 */
	onMarkerDragEnd( event ) {
		let newLat = event.latLng.lat(),
		    newLng = event.latLng.lng();

		Geocode.fromLatLng( newLat , newLng ).then(
			response => {
				const address = response.results[0].formatted_address,
				      addressArray =  response.results[0].address_components,
				      city = this.getCity( addressArray ),
				      area = this.getArea( addressArray ),
				      state = this.getState( addressArray );
				this.setState( {
					address: ( address ) ? address : '',
					area: ( area ) ? area : '',
					city: ( city ) ? city : '',
					state: ( state ) ? state : '',
					markerPosition: {
						lat: newLat,
						lng: newLng
					},
					mapPosition: {
						lat: newLat,
						lng: newLng
					},
				} )
			},
			error => {
				console.error(error);
			}
		);
	};

	/**
	 * When the user types an address in the search box
	 * @param place
	 */
	onPlaceSelected( place ) {
		console.log( 'plc', place );
		const address = place.formatted_address,
		      addressArray =  place.address_components,
		      city = this.getCity( addressArray ),
		      area = this.getArea( addressArray ),
		      state = this.getState( addressArray ),
		      latValue = place.geometry.location.lat(),
		      lngValue = place.geometry.location.lng();
		// Set these values in the state.
		this.setState({
			address: ( address ) ? address : '',
			area: ( area ) ? area : '',
			city: ( city ) ? city : '',
			state: ( state ) ? state : '',
			markerPosition: {
				lat: latValue,
				lng: lngValue
			},
			mapPosition: {
				lat: latValue,
				lng: lngValue
			},
		})
	};


	render() {
    const {
      clicked,
      places, address, city,
      area, state, mapPosition,
      markerPosition
    } = this.state;

		const AsyncMap = withScriptjs(
			withGoogleMap(
				props => (
					<GoogleMap google={ this.props.google }
					           defaultZoom={ this.props.zoom }
					           defaultCenter={{ lat: mapPosition.lat, lng: mapPosition.lng }}
					>
						{/* InfoWindow on top of marker */}
						<InfoWindow
							onClose={this.onInfoWindowClose}
							position={{ lat: ( markerPosition.lat + 0.0018 ), lng: markerPosition.lng }}
						>
							<div>
								<span style={{ padding: 0, margin: 0 }}>{ address }</span>
							</div>
						</InfoWindow>
						{/*Marker*/}
						<Marker google={this.props.google}
						        name={'Dolores park'}
						        draggable={true}
						        onDragEnd={ this.onMarkerDragEnd }
						        position={{ lat: markerPosition.lat, lng: markerPosition.lng }}
						/>
						<Marker />
						{/* For Auto complete Search Box */}
						<Autocomplete
							style={{
								width: '100%',
								height: '40px',
								paddingLeft: '16px',
								marginTop: '2px',
								marginBottom: '500px'
							}}
							onPlaceSelected={ this.onPlaceSelected }
							types={['(regions)']}
						/>
					</GoogleMap>
				)
			)
		);
		let map;
		if( this.props.center.lat !== undefined ) {
			map = <div>
				<div>
					<div className="form-group">
						<label htmlFor="">City</label>
						<input type="text" name="city" className="form-control" onChange={ this.onChange } readOnly="readOnly" value={ city }/>
					</div>
					<div className="form-group">
						<label htmlFor="">Area</label>
						<input type="text" name="area" className="form-control" onChange={ this.onChange } readOnly="readOnly" value={ area }/>
					</div>
					<div className="form-group">
						<label htmlFor="">State</label>
						<input type="text" name="state" className="form-control" onChange={ this.onChange } readOnly="readOnly" value={ state }/>
					</div>
					<div className="form-group">
						<label htmlFor="">Address</label>
						<input type="text" name="address" className="form-control" onChange={ this.onChange } readOnly="readOnly" value={ address }/>
					</div>
				</div>

				<AsyncMap
					googleMapURL={`https://maps.googleapis.com/maps/api/js?key=AIzaSyAIShYGz5mXtO2XtWhaOHlrmDz33fKCnmE&libraries=places`}
					loadingElement={
						<div style={{ height: `100%` }} />
					}
					containerElement={
						<div style={{ height: this.props.height }} />
					}
					mapElement={
						<div style={{ height: `100%` }} />
					}
				/>
			</div>
		} else {
			map = <div style={{height: this.props.height}} />
    }
    
		return(
      <div>
        <button id='settings'>Menu</button>
        <div id='header3'>Popular Locations</div>
        <div className='map'>{map}</div>
        <button id="loginn" type="button" onClick={this.displayForm}>Add This Location</button>
        <div id="under">{clicked ? (
          <div id="location-form">
            <h3>Describe This Location</h3>
            <div class="sc-container">
              <input classname='create' id="name" type="text" placeholder="Location Name" /><br /><br />
              <input classname='create' id="image" type="text" placeholder="Add an Image" /><br /><br />
              <input classname='create' id="desc" type="text" placeholder="Description" /><br /><br />
              <button id="login" type="button" onClick={this.addLoc}>Submit</button>
            </div>
          </div>
          ) : <div></div>}</div>
        <ul style={{ marginLeft: '20%', columnCount: '3', height: '800px' }}>
          {places}
        </ul>
      </div>    
    );
	}
}

export default PopularLocations;