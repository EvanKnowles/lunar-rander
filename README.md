# lunar-rander
It's just like Lunar lander (well, not really, kinda an arm-length estimate), but on the surface of the USD/ZAR exchange rate.

On load, it pulls the last 90 days (which may take a while, we need a loading screen) of data, caches it in localStorage (whew),
the lets you try land a modified taxi on it.

Financial data is coming from fixer.io, everything else is hacked together.

![awesome screenshot of stars and stuff](screens/flames.png)