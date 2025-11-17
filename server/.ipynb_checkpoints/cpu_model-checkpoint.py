import joblib
import pandas as pd
import psutil
import time
import json
import sys

# Load the trained model (expects 34 features)
model = joblib.load("rf_model.pkl")

# Define the 34 features in the same order used during training
FEATURES = [
    'cpu_idle', 'cpu_system', 'cpu_total', 'cpu_user',
    'diskio_sda1_read_bytes', 'diskio_sda1_time_since_update',
    'diskio_sda1_write_bytes', 'diskio_sda1_write_time',
    'diskio_sda_time_since_update', 'diskio_sda_write_time',
    'mem_available', 'mem_buffered', 'mem_cached', 'mem_free',
    'mem_total', 'mem_used', 'mem_used_percent',
    'net_eth0_bytes_recv', 'net_eth0_bytes_sent',
    'net_eth0_dropin', 'net_eth0_dropout', 'net_eth0_packets_recv',
    'net_eth0_packets_sent', 'proc_loadavg_1min', 'proc_loadavg_5min',
    'proc_loadavg_15min', 'proc_num_threads', 'proc_num_running',
    'proc_num_sleeping', 'proc_num_stopped', 'proc_num_zombie',
    'uptime', 'cpu_frequency', 'cpu_count'
]

# Collect live system metrics
def get_system_metrics():
    cpu_times = psutil.cpu_times_percent(interval=1)
    mem = psutil.virtual_memory()
    disk = psutil.disk_io_counters()
    net = psutil.net_io_counters()
    load1, load5, load15 = psutil.getloadavg()

    # Fill in your features properly (approximation shown)
    data = {
        'cpu_idle': cpu_times.idle,
        'cpu_system': cpu_times.system,
        'cpu_total': cpu_times.user + cpu_times.system,
        'cpu_user': cpu_times.user,
        'diskio_sda1_read_bytes': disk.read_bytes,
        'diskio_sda1_time_since_update': 0,
        'diskio_sda1_write_bytes': disk.write_bytes,
        'diskio_sda1_write_time': 0,
        'diskio_sda_time_since_update': 0,
        'diskio_sda_write_time': 0,
        'mem_available': mem.available,
        'mem_buffered': getattr(mem, 'buffers', 0),
        'mem_cached': getattr(mem, 'cached', 0),
        'mem_free': mem.free,
        'mem_total': mem.total,
        'mem_used': mem.used,
        'mem_used_percent': mem.percent,
        'net_eth0_bytes_recv': net.bytes_recv,
        'net_eth0_bytes_sent': net.bytes_sent,
        'net_eth0_dropin': net.dropin,
        'net_eth0_dropout': net.dropout,
        'net_eth0_packets_recv': net.packets_recv,
        'net_eth0_packets_sent': net.packets_sent,
        'proc_loadavg_1min': load1,
        'proc_loadavg_5min': load5,
        'proc_loadavg_15min': load15,
        'proc_num_threads': 0,
        'proc_num_running': 0,
        'proc_num_sleeping': 0,
        'proc_num_stopped': 0,
        'proc_num_zombie': 0,
        'uptime': time.time(),
        'cpu_frequency': psutil.cpu_freq().current if psutil.cpu_freq() else 0,
        'cpu_count': psutil.cpu_count()
    }

    return data


# Collect data & predict
metrics = get_system_metrics()
df = pd.DataFrame([metrics], columns=FEATURES)

pred = model.predict(df)[0]
label = "cryptojack_detected" if pred == 1 else "benign"

print(json.dumps({
    "prediction": int(pred),
    "label": label,
    "features": metrics
}))
