from gradius_neo.platform import ApplicationHost


def test_application_host_exposes_midlet_version() -> None:
    host = ApplicationHost()

    assert host.getAppProperty("MIDlet-Version") == "1.0"
    assert host.getAppProperty("Unknown") == ""


def test_application_host_accepts_property_overrides() -> None:
    host = ApplicationHost({"MIDlet-Version": "2.0"})

    assert host.getAppProperty("MIDlet-Version") == "2.0"
