---
title: 'Building an Uber Clone with Flutter and Supabase'
description: 'Learn how to handle real-time geospatial data using Supabase Realtime and Flutter.'
author: tyler_shukert
imgSocial: flutter-uber-clone/flutter-uber-clone-thumb.png
imgThumb: flutter-uber-clone/flutter-uber-clone-thumb.png
categories:
  - developers
tags:
  - realtime
  - flutter
date: '2024-09-05'
toc_depth: 3
---

<Admonition>

[Do you prefer audio-visual learning? Watch the video guide!](https://youtu.be/cL4pVpaOH9o)

[Or jump straight into the code](https://github.com/dshukertjr/uber-clone)

</Admonition>

Postgres can handle geography data efficiently thanks to the PostGIS extension. Combining it with Supabase realtime and you can create a real-time location tracking app.

In this tutorial, we will guide you through the process of creating an Uber-like application using Flutter and Supabase. This project demonstrates the capabilities of Supabase for building complex, real-time applications with minimal backend code.

## App Overview

An actual Uber app has two apps, the consumer facing app and the driver facing app. This article only covers the consumer facing app. The app works by first choosing a destination, and then waiting for the driver to come pick them up. Once they are picked up, they head to the destination and the journey is complete once they arrive at the destination. Throughout the lifecycle of the app, the driver’s position is shared on screen in real-time.

The focus of the app is to showcase how to use Supabase realtime with geographical data, so handling payments will not be covered in this article.

<video width="99%" loop muted playsInline controls={true}>
  <source
    src="https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/videos/marketing/blog/flutter-uber-clone/uber-clone-demo.mp4"
    type="video/mp4"
  />
</video>

## Prerequisites

Before beginning, ensure you have:

1. Flutter installed
2. A Supabase account - head to [database.new](http://database.new) if you don’t have one yet.
3. Basic knowledge of Dart and Flutter

## Step 1: Project Setup

Start by creating a blank Flutter project.

```bash
flutter create canvas --empty --platforms=ios,android
```

Then, add the required dependencies to your `pubspec.yaml` file:

```yaml
supabase_flutter: ^2.5.9
google_maps_flutter: ^2.7.0
geolocator: ^12.0.0
duration: ^3.0.13
intl: ^0.19.0
```

`google_maps_flutter` is used to display the map on our app. We will also draw and move icons on the map. `geolocator` is used to access the GPS information. `duration` is used to parse duration value returned from Google’s routes API, and `intl` is used to display currencies nicely.

In addition to adding it to `pubspec.yaml` file, `google_maps_flutter` requires additional setup to get started. Follow the [readme.md](https://pub.dev/packages/google_maps_flutter) file to configure Google Maps for the platform you want to support.

Run `flutter pub get` to install these dependencies.

## Step 2: Supabase Initialization

In your `main.dart` file, initialize Supabase with the following code:

```dart
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  await Supabase.initialize(
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  );
  runApp(const MainApp());
}

final supabase = Supabase.instance.client;
```

Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual Supabase project credentials.

## Step 3: Database Configuration

We need to create two tables for this application. The `drivers` table holds the vehicle information as well as the position. Notice that we have a `latitude` and `longitude` generated column. These columns are generated from the `location` column, and will be used to display the real-time location on the map later on.

The `rides` table holds information about customer’s request to get a ride.

```sql
-- Enable the "postgis" extension
create extension postgis with schema extensions;

create table if not exists public.drivers (
	id uuid primary key default gen_random_uuid(),
	model text not null,
  number text not null,
  is_available boolean not null default false,
	location geography(POINT) not null,
  latitude double precision generated always as (st_y(location::geometry)) stored,
  longitude double precision generated always as (st_x(location::geometry)) stored
);

create type ride_status as enum ('picking_up', 'riding', 'completed');

create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id),
  passenger_id uuid not null references auth.users(id),
  origin geography(POINT) not null,
  destination geography(POINT) not null,
  fare integer not null,
  status ride_status not null default 'picking_up'
);
```

Let’s also set [row level security](https://supabase.com/docs/guides/database/postgres/row-level-security) policies for the tables to secure our database.

```sql
alter table public.drivers enable row level security;
create policy "Any authenticated users can select drivers." on public.drivers for select to authenticated using (true);
create policy "Drivers can update their own status." on public.drivers for update to authenticated using (auth.uid() = id);

alter table public.rides enable row level security;
create policy "The driver or the passenger can select the ride." on public.rides for select to authenticated using (driver_id = auth.uid() or passenger_id = auth.uid());
create policy "The driver can update the status. " on public.rides for update to authenticated using (auth.uid() = driver_id);
```

Lastly, we will create a few database functions and triggers. The first function and trigger updates the driver status depending on the status of the ride. This ensures that the driver status is always in sync with the status of the ride.

The second function is for the customer to find available drivers. This function will be called from the Flutter app, which automatically find available drivers within 3,000m radius and returns the driver ID and a newly created ride ID if a driver was found.

```sql
-- Create a trigger to update the driver status
create function update_driver_status()
    returns trigger
    language plpgsql
    as $$
        begin
            if new.status = 'completed' then
                update public.drivers
                set is_available = true
                where id = new.driver_id;
            else
                update public.drivers
                set is_available = false
                where id = new.driver_id;
            end if;
            return new;
    end $$;

create trigger driver_status_update_trigger
after insert or update on rides
for each row
execute function update_driver_status();

-- Finds the closest available driver within 3000m radius
create function public.find_driver(origin geography(POINT), destination geography(POINT), fare int)
    returns table(driver_id uuid, ride_id uuid)
    language plpgsql
    as $$
        declare
            v_driver_id uuid;
            v_ride_id uuid;
        begin
            select
                drivers.id into v_driver_id
            from public.drivers
            where is_available = true
                and st_dwithin(origin, location, 3000)
            order by drivers.location <-> origin
            limit 1;

            -- return null if no available driver is found
            if v_driver_id is null then
                return;
            end if;

            insert into public.rides (driver_id, passenger_id, origin, destination, fare)
            values (v_driver_id, auth.uid(), origin, destination, fare)
            returning id into v_ride_id;

            return query
                select v_driver_id as driver_id, v_ride_id as ride_id;
    end $$ security definer;

```

## Step 4: Defining the models

Start by defining the models for this app. The `AppState` enum holds the 5 different state that this app could take in the order that it proceeds. The `Ride` and `Driver` class are simple data class for the `rides` and `drivers` table we created earlier.

```dart
enum AppState {
  choosingLocation,
  confirmingFare,
  waitingForPickup,
  riding,
  postRide,
}

enum RideStatus {
  picking_up,
  riding,
  completed,
}

class Ride {
  final String id;
  final String driverId;
  final String passengerId;
  final int fare;
  final RideStatus status;

  Ride({
    required this.id,
    required this.driverId,
    required this.passengerId,
    required this.fare,
    required this.status,
  });

  factory Ride.fromJson(Map<String, dynamic> json) {
    return Ride(
      id: json['id'],
      driverId: json['driver_id'],
      passengerId: json['passenger_id'],
      fare: json['fare'],
      status: RideStatus.values
          .firstWhere((e) => e.toString().split('.').last == json['status']),
    );
  }
}

class Driver {
  final String id;
  final String model;
  final String number;
  final bool isAvailable;
  final LatLng location;

  Driver({
    required this.id,
    required this.model,
    required this.number,
    required this.isAvailable,
    required this.location,
  });

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: json['id'],
      model: json['model'],
      number: json['number'],
      isAvailable: json['is_available'],
      location: LatLng(json['latitude'], json['longitude']),
    );
  }
}
```

## Step 5: Main UI Implementation

Create a `UberCloneMainScreen` widget to serve as the main interface for the application. This widget will manage the five different `AppState` that we created in the previous step.

1. Location selection - The customer scrolls through the map and chooses the destination
2. Fare confirmation - The fare is displayed to the user, and the customer can accept the fare to find a nearby driver
3. Pickup waiting - A driver was found, and the customer is waiting for the driver to arrive
4. In-ride - The customer has got on the car, and they are headed to the destination
5. Post-ride - The customer has arrived at the destination, and a thank you modal is displayed

For statuses 3, 4, and 5, the status update happens on the driver’s app, which we don’t have. So you can directly modify the data from the Supabase dashboard and update the status of the ride.

```dart
class UberCloneMainScreen extends StatefulWidget {
  const UberCloneMainScreen({super.key});

  @override
  UberCloneMainScreenState createState() => UberCloneMainScreenState();
}

class UberCloneMainScreenState extends State<UberCloneMainScreen> {
  AppState _appState = AppState.choosingLocation;
  GoogleMapController? _mapController;

  /// The default camera position is arbitrarily set to San Francisco.
  CameraPosition _initialCameraPosition = const CameraPosition(
    target: LatLng(37.7749, -122.4194),
    zoom: 14.0,
  );

  /// The selected destination by the user.
  LatLng? _selectedDestination;

  /// The current location of the user.
  LatLng? _currentLocation;

  final Set<Polyline> _polylines = {};
  final Set<Marker> _markers = {};

  /// Fare in cents
  int? _fare;
  StreamSubscription<dynamic>? _driverSubscription;
  StreamSubscription<dynamic>? _rideSubscription;
  Driver? _driver;

  LatLng? _previousDriverLocation;
  BitmapDescriptor? _pinIcon;
  BitmapDescriptor? _carIcon;

  @override
  void initState() {
    super.initState();
    _signInIfNotSignedIn();
    _checkLocationPermission();
    _loadIcons();
  }

  @override
  void dispose() {
    _cancelSubscriptions();
    super.dispose();
  }

  // TODO: Add missing methods

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_getAppBarTitle()),
      ),
      body: Stack(
        children: [
          _currentLocation == null
              ? const Center(child: CircularProgressIndicator())
              : GoogleMap(
                  initialCameraPosition: _initialCameraPosition,
                  onMapCreated: (GoogleMapController controller) {
                    _mapController = controller;
                  },
                  myLocationEnabled: true,
                  onCameraMove: _onCameraMove,
                  polylines: _polylines,
                  markers: _markers,
                ),
          if (_appState == AppState.choosingLocation)
            Center(
              child: Image.asset(
                'assets/images/center-pin.png',
                width: 96,
                height: 96,
              ),
            ),
        ],
      ),
      floatingActionButton: _appState == AppState.choosingLocation
          ? FloatingActionButton.extended(
              onPressed: _confirmLocation,
              label: const Text('Confirm Destination'),
              icon: const Icon(Icons.check),
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      bottomSheet: _appState == AppState.confirmingFare ||
              _appState == AppState.waitingForPickup
          ? Container(
              width: MediaQuery.of(context).size.width,
              padding: const EdgeInsets.all(16)
                  .copyWith(bottom: 16 + MediaQuery.of(context).padding.bottom),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.5),
                    spreadRadius: 5,
                    blurRadius: 7,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_appState == AppState.confirmingFare) ...[
                    Text('Confirm Fare',
                        style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 16),
                    Text(
                        'Estimated fare: ${NumberFormat.currency(
                          symbol:
                              '\$', // You can change this to your preferred currency symbol
                          decimalDigits: 2,
                        ).format(_fare! / 100)}',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _findDriver,
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 50),
                      ),
                      child: const Text('Confirm Fare'),
                    ),
                  ],
                  if (_appState == AppState.waitingForPickup &&
                      _driver != null) ...[
                    Text('Your Driver',
                        style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 8),
                    Text('Car: ${_driver!.model}',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text('Plate Number: ${_driver!.number}',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 16),
                    Text(
                        'Your driver is on the way. Please wait at the pickup location.',
                        style: Theme.of(context).textTheme.bodyMedium),
                  ]
                ],
              ),
            )
          : const SizedBox.shrink(),
    );
  }
}

```

The code above still has many missing methods, so do not worry if you see many errors.

## Step 6: Location Selection Implementation

The way the customer chooses the destination is by scrolling through the map and tapping on the confirmation FAB. Once the FAB is pressed, the `_confirmLocation` method is called, which calls a Supabase Edge Function called `route`. This `route` function returns a list of coordinates to create a polyline to get from the current location to the destination. We then draw the polyline on the Google Maps to provide to simulate an Uber-like user experience.

```dart
Future<void> _confirmLocation() async {
    if (_selectedDestination != null && _currentLocation != null) {
      try {
        final response = await supabase.functions.invoke(
          'route',
          body: {
            'origin': {
              'latitude': _currentLocation!.latitude,
              'longitude': _currentLocation!.longitude,
            },
            'destination': {
              'latitude': _selectedDestination!.latitude,
              'longitude': _selectedDestination!.longitude,
            },
          },
        );

        final data = response.data as Map<String, dynamic>;
        final coordinates = data['legs'][0]['polyline']['geoJsonLinestring']
            ['coordinates'] as List<dynamic>;
        final duration = parseDuration(data['duration'] as String);
        _fare = ((duration.inMinutes * 40)).ceil();

        final List<LatLng> polylineCoordinates = coordinates.map((coord) {
          return LatLng(coord[1], coord[0]);
        }).toList();

        setState(() {
          _polylines.add(Polyline(
            polylineId: const PolylineId('route'),
            points: polylineCoordinates,
            color: Colors.black,
            width: 5,
          ));

          _markers.add(Marker(
            markerId: const MarkerId('destination'),
            position: _selectedDestination!,
            icon: _pinIcon ??
                BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
          ));
        });

        LatLngBounds bounds = LatLngBounds(
          southwest: LatLng(
            polylineCoordinates
                .map((e) => e.latitude)
                .reduce((a, b) => a < b ? a : b),
            polylineCoordinates
                .map((e) => e.longitude)
                .reduce((a, b) => a < b ? a : b),
          ),
          northeast: LatLng(
            polylineCoordinates
                .map((e) => e.latitude)
                .reduce((a, b) => a > b ? a : b),
            polylineCoordinates
                .map((e) => e.longitude)
                .reduce((a, b) => a > b ? a : b),
          ),
        );
        _mapController?.animateCamera(CameraUpdate.newLatLngBounds(bounds, 50));
        _goToNextState();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: ${e.toString()}')),
          );
        }
      }
    }
  }

```

Let’s also create the `route` edge functions. This function calls the [routes API from Google](https://developers.google.com/maps/documentation/routes), which provides us the array of lines on the map to take us from the customer’s current location to the destination.

Run the following commands to create the edge functions.

```bash
# initialize Supabase
npx supabase init

# Create a new function named route
npx supabase functions new route
```

```tsx
type Coordinates = {
  latitude: number
  longitude: number
}

Deno.serve(async (req) => {
  const {
    origin,
    destination,
  }: {
    origin: Coordinates
    destination: Coordinates
  } = await req.json()

  const response = await fetch(
    `https://routes.googleapis.com/directions/v2:computeRoutes?key=${Deno.env.get(
      'GOOGLE_MAPS_API_KEY'
    )}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask':
          'routes.duration,routes.distanceMeters,routes.polyline,routes.legs.polyline',
      },
      body: JSON.stringify({
        origin: { location: { latLng: origin } },
        destination: { location: { latLng: destination } },
        travelMode: 'DRIVE',
        polylineEncoding: 'GEO_JSON_LINESTRING',
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    console.error({ error })
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()

  const res = data.routes[0]

  return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } })
})
```

Once the function is ready, you can [run it locally](https://supabase.com/docs/guides/functions/quickstart) or [deploy it to a remote Supabase instance](https://supabase.com/docs/guides/functions/deploy).

## Step 7: Driver Assignment

Now, once a route is displayed on the map and the customer agrees on the fare, a driver needs to be found. We created a convenient method for this earlier, so we can just call the method to find a driver and create a new ride.

If a driver was successfully found, we listen to real-time changes on both the driver and the ride to keep track of the driver’s position and the ride’s current status. For this, we use the [.stream()](https://supabase.com/docs/reference/dart/stream) method.

```dart
  /// Finds a nearby driver
  ///
  /// When a driver is found, it subscribes to the driver's location and ride status.
  Future<void> _findDriver() async {
    try {
      final response = await supabase.rpc('find_driver', params: {
        'origin':
            'POINT(${_currentLocation!.longitude} ${_currentLocation!.latitude})',
        'destination':
            'POINT(${_selectedDestination!.longitude} ${_selectedDestination!.latitude})',
        'fare': _fare,
      }) as List<dynamic>;

      if (response.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('No driver found. Please try again later.')),
          );
        }
        return;
      }
      String driverId = response.first['driver_id'];
      String rideId = response.first['ride_id'];

      _driverSubscription = supabase
          .from('drivers')
          .stream(primaryKey: ['id'])
          .eq('id', driverId)
          .listen((List<Map<String, dynamic>> data) {
            if (data.isNotEmpty) {
              setState(() {
                _driver = Driver.fromJson(data[0]);
              });
              _updateDriverMarker(_driver!);
              _adjustMapView(
                  target: _appState == AppState.waitingForPickup
                      ? _currentLocation!
                      : _selectedDestination!);
            }
          });

      _rideSubscription = supabase
          .from('rides')
          .stream(primaryKey: ['id'])
          .eq('id', rideId)
          .listen((List<Map<String, dynamic>> data) {
            if (data.isNotEmpty) {
              setState(() {
                final ride = Ride.fromJson(data[0]);
                if (ride.status == RideStatus.riding &&
                    _appState != AppState.riding) {
                  _appState = AppState.riding;
                } else if (ride.status == RideStatus.completed &&
                    _appState != AppState.postRide) {
                  _appState = AppState.postRide;
                  _cancelSubscriptions();
                  _showCompletionModal();
                }
              });
            }
          });

      _goToNextState();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

```

## Step 8: Updating the car icon on the map

We will not make an app for the driver in this article, but let’s imagine we had one. As the driver’s car moves, it could update it’s position on the `drivers` table. In the previous step, we are listening to the driver’s position being updated, and using those information, we could move the car in the UI as well.

Implement `_updateDriverMarker` method, which updates the driver’s icon on the map as the position changes. We can also calculate the angle at which the driver is headed to using the previous position and the current position.

```dart
  void _updateDriverMarker(Driver driver) {
    setState(() {
      _markers.removeWhere((marker) => marker.markerId.value == 'driver');

      double rotation = 0;
      if (_previousDriverLocation != null) {
        rotation =
            _calculateRotation(_previousDriverLocation!, driver.location);
      }

      _markers.add(Marker(
        markerId: const MarkerId('driver'),
        position: driver.location,
        icon: _carIcon!,
        anchor: const Offset(0.5, 0.5),
        rotation: rotation,
      ));

      _previousDriverLocation = driver.location;
    });
  }

  void _adjustMapView({required LatLng target}) {
    if (_driver != null && _selectedDestination != null) {
      LatLngBounds bounds = LatLngBounds(
        southwest: LatLng(
          min(_driver!.location.latitude, target.latitude),
          min(_driver!.location.longitude, target.longitude),
        ),
        northeast: LatLng(
          max(_driver!.location.latitude, target.latitude),
          max(_driver!.location.longitude, target.longitude),
        ),
      );
      _mapController?.animateCamera(CameraUpdate.newLatLngBounds(bounds, 100));
    }
  }

  double _calculateRotation(LatLng start, LatLng end) {
    double latDiff = end.latitude - start.latitude;
    double lngDiff = end.longitude - start.longitude;
    double angle = atan2(lngDiff, latDiff);
    return angle * 180 / pi;
  }
```

## Step 9: Ride Completion

Finally when the car arrives at the destination (when the driver updates the status to `completed`), a modal thanking the user for using the app shows up. Implement `_showCompletionModal` to greet our valuable customers.

Upon closing the modal, we reset the app’s state so that the user can take another ride.

```dart
  /// Shows a modal to indicate that the ride has been completed.
  void _showCompletionModal() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Ride Completed'),
          content: const Text(
              'Thank you for using our service! We hope you had a great ride.'),
          actions: <Widget>[
            TextButton(
              child: const Text('Close'),
              onPressed: () {
                Navigator.of(context).pop();
                _resetAppState();
              },
            ),
          ],
        );
      },
    );
  }

  void _resetAppState() {
    setState(() {
      _appState = AppState.choosingLocation;
      _selectedDestination = null;
      _driver = null;
      _fare = null;
      _polylines.clear();
      _markers.clear();
      _previousDriverLocation = null;
    });
    _getCurrentLocation();
  }

```

With the edge function deployed, you should be able to run the app at this point. Note that you do need to manually tweak the driver and ride data to test out all the features. I have created a [simple script that simulates the movement and status updates of a driver](https://github.com/dshukertjr/uber-clone/tree/main/scripts/dart) so that you can enjoy the full Uber experience without actually manually updating anything from the dashboard.

You can also find the complete code [here](https://github.com/dshukertjr/uber-clone) to fully see everything put together.

## Conclusion

This tutorial has walked you through the process of building a basic Uber clone using Flutter and Supabase. The application demonstrates how easy it is to handle real-time geospatial data using Supabase and Flutter.

This implementation serves as a foundation that can be expanded upon. Additional features such as processing payments, ride history, and driver ratings can be incorporated to enhance the application's functionality.

Want to learn more about Maps and PostGIS? Make sure to follow our [Twitter](https://x.com/supabase) and [YouTube](https://www.youtube.com/@Supabase) channels to not miss out! See you then!

## More Supabase Resources

- [Flutter Tutorial: building a Flutter chat app](https://supabase.com/blog/flutter-tutorial-building-a-chat-app)
- [Generate Flame template using Very Good CLI](https://verygood.ventures/blog/generate-a-game-with-our-new-template)
- [Supabase Flutter SDK docs](https://supabase.com/docs/reference/dart/start)
