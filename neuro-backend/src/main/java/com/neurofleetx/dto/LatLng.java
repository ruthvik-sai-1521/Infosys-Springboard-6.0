package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LatLng {
    private Double latitude;
    private Double longitude;

    public LatLng(double lat, double lng) {
        this.latitude = lat;
        this.longitude = lng;
    }
}
