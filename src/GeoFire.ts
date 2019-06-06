/**
 * GeoFire is an open-source library that allows you to store and query a set
 * of keys based on their geographic location. At its heart, GeoFire simply
 * stores locations with string keys. Its main benefit, however, is the
 * possibility of retrieving only those keys within a given geographic area -
 * all in realtime.
 *
 * GeoFire 0.0.0
 * https://github.com/firebase/geofire-js/
 * License: MIT
 */
import { GeoQuery } from './GeoQuery';
import { decodeGeoFireObject, distance, encodeGeoFireObject, encodeGeohash, validateLocation, validateKey } from './utils';
import { GeoFireTypes } from './GeoFireTypes';
import {map as Rmap}  from 'ramda'

type element = {
  key: string,
  location: {
    lat: number,
    lng: number
  },
  [x: string]: any
}

/**
 * Creates a GeoFire instance.
 */
export class GeoFire {
  /**
   * @param _firebaseRef A Firebase reference where the GeoFire data will be stored.
   */
  constructor(private _firebaseRef: GeoFireTypes.firebase.Reference) {
    if (Object.prototype.toString.call(this._firebaseRef) !== '[object Object]') {
      throw new Error('firebaseRef must be an instance of Firebase');
    }
  }

  /********************/
  /*  PUBLIC METHODS  */
  /********************/
  /**
   * Returns a promise fulfilled with the location corresponding to the provided key.
   *
   * If the provided key does not exist, the returned promise is fulfilled with null.
   *
   * @param key The key of the location to retrieve.
   * @returns A promise that is fulfilled with the location of the given key.
   */
  public get(key: string) {
    validateKey(key);
    return this._firebaseRef
    .child(key)
    .once('value')
    .then((dataSnapshot: GeoFireTypes.firebase.DataSnapshot) => {
      const snapshotVal = dataSnapshot.val();
      if (snapshotVal === null) {
        return null;
      } else {
        return {
          location: decodeGeoFireObject(snapshotVal),
          ...snapshotVal
        };
      }
    });
  }

  /**
   * Returns the Firebase instance used to create this GeoFire instance.
   *
   * @returns The Firebase instance used to create this GeoFire instance.
   */
  public ref(): GeoFireTypes.firebase.Reference {
    return this._firebaseRef;
  }

  /**
   * Removes the provided key from this GeoFire. Returns an empty promise fulfilled when the key has been removed.
   *
   * If the provided key is not in this GeoFire, the promise will still successfully resolve.
   *
   * @param key The key of the location to remove.
   * @returns A promise that is fulfilled after the inputted key is removed.
   */
  public remove(key: string): Promise<string> {
    return this._firebaseRef.remove();
  }

  /**
   * Adds the provided key - location pair(s) to Firebase. Returns an empty promise which is fulfilled when the write is complete.
   *
   * If any provided key already exists in this GeoFire, it will be overwritten with the new location value.
   *
   * @param keyOrLocations The key representing the location to add or a mapping of key - location pairs which
   * represent the locations to add.
   * @param location The [latitude, longitude] pair to add.
   * @returns A promise that is fulfilled when the write is complete.
   */

  public set(data: element[]): Promise<any> {

    const toDocument = ({key, location: l, ...rest}: element) => {
      const s = [l.lat, l.lng]

      validateKey(key)
      validateLocation(s)

      const encoded: GeoFireTypes.Document = encodeGeoFireObject(s, encodeGeohash(s))
      return {
        [key]: encoded,
        ...rest
      }
    }
    return this._firebaseRef.update(Rmap(toDocument, data));
  }

  /**
   * Returns a new GeoQuery instance with the provided queryCriteria.
   *
   * @param queryCriteria The criteria which specifies the GeoQuery's center and radius.
   * @return A new GeoQuery object.
   */
  public query(queryCriteria: GeoFireTypes.QueryCriteria): GeoQuery {
    return new GeoQuery(this._firebaseRef, queryCriteria);
  }

  /********************/
  /*  STATIC METHODS  */
  /********************/
  /**
   * Static method which calculates the distance, in kilometers, between two locations,
   * via the Haversine formula. Note that this is approximate due to the fact that the
   * Earth's radius varies between 6356.752 km and 6378.137 km.
   *
   * @param location1 The [latitude, longitude] pair of the first location.
   * @param location2 The [latitude, longitude] pair of the second location.
   * @returns The distance, in kilometers, between the inputted locations.
   */
  public static distance(location1: number[], location2: number[]): number {
    return distance(location1, location2);
  }
}
