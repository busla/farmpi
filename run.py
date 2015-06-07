from w1thermsensor import W1ThermSensor
from time import sleep, gmtime, strftime


while True:
    print("####################"+strftime("%d-%m-%Y %H:%M:%S", gmtime())+"########################")

    for sensor in W1ThermSensor.get_available_sensors():
        print("Sensor %s has temperature of %.2f F and %.2f C" % (sensor.id, sensor.get_temperature(W1ThermSensor.DEGREES_F), sensor.get_temperature(W1ThermSensor.DEGREES_C)))

    sleep(1)
