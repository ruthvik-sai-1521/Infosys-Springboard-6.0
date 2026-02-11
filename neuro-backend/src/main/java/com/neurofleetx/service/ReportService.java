package com.neurofleetx.service;

import com.neurofleetx.model.Trip;
import com.neurofleetx.model.User;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.TripRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.VehicleRepository;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

@Service
public class ReportService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private TripRepository tripRepository;

    private static final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public byte[] generateDriversReportCSV() throws Exception {
        List<User> drivers = userRepository.findByRole("DRIVER");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        CSVPrinter csvPrinter = new CSVPrinter(new OutputStreamWriter(out), 
            CSVFormat.DEFAULT.builder()
                .setHeader("ID", "Username", "Email", "Mobile Number", "Aadhaar Number", "Verification Status", "Vehicle Count")
                .build());

        for (User driver : drivers) {
            long vehicleCount = vehicleRepository.countByDriverId(driver.getId());
            csvPrinter.printRecord(
                driver.getId(),
                driver.getUsername(),
                driver.getEmail(),
                driver.getMobileNumber() != null ? driver.getMobileNumber() : "N/A",
                driver.getAadhaarNumber() != null ? driver.getAadhaarNumber() : "N/A",
                driver.getVerificationStatus() != null ? driver.getVerificationStatus() : "PENDING",
                vehicleCount
            );
        }

        csvPrinter.flush();
        csvPrinter.close();
        return out.toByteArray();
    }

    public byte[] generateDriversReportPDF() throws Exception {
        List<User> drivers = userRepository.findByRole("DRIVER");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        document.add(new Paragraph("All Drivers Report").setFontSize(20).setBold().setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("Generated on: " + LocalDateTime.now().format(dateFormatter)).setFontSize(10).setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("\n"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 3, 4, 3, 3, 2, 2}));
        table.setWidth(UnitValue.createPercentValue(100));

        table.addHeaderCell(new Cell().add(new Paragraph("ID").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Username").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Email").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Mobile").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Aadhaar").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Status").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Vehicles").setBold()));

        for (User driver : drivers) {
            long vehicleCount = vehicleRepository.countByDriverId(driver.getId());
            table.addCell(String.valueOf(driver.getId()));
            table.addCell(driver.getUsername());
            table.addCell(driver.getEmail());
            table.addCell(driver.getMobileNumber() != null ? driver.getMobileNumber() : "N/A");
            table.addCell(driver.getAadhaarNumber() != null ? driver.getAadhaarNumber() : "N/A");
            table.addCell(driver.getVerificationStatus() != null ? driver.getVerificationStatus() : "PENDING");
            table.addCell(String.valueOf(vehicleCount));
        }

        document.add(table);
        document.add(new Paragraph("\nTotal Drivers: " + drivers.size()).setBold());
        document.close();
        return out.toByteArray();
    }

    public byte[] generateVehiclesReportCSV() throws Exception {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        CSVPrinter csvPrinter = new CSVPrinter(new OutputStreamWriter(out), 
            CSVFormat.DEFAULT.builder()
                .setHeader("ID", "Vehicle Number", "Type", "Seat Count", "Status", "Assigned Driver", "Health Score", "Last Service")
                .build());

        for (Vehicle vehicle : vehicles) {
            csvPrinter.printRecord(
                vehicle.getId(),
                vehicle.getVehicleNumber(),
                vehicle.getType(),
                vehicle.getSeatCount() != null ? vehicle.getSeatCount() : "N/A",
                vehicle.getStatus(),
                vehicle.getDriver() != null ? vehicle.getDriver().getUsername() : "Unassigned",
                vehicle.getHealthScore() != null ? vehicle.getHealthScore() : "N/A",
                vehicle.getLastServiceDate() != null ? vehicle.getLastServiceDate().format(dateFormatter) : "N/A"
            );
        }

        csvPrinter.flush();
        csvPrinter.close();
        return out.toByteArray();
    }

    public byte[] generateVehiclesReportPDF() throws Exception {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        document.add(new Paragraph("All Vehicles Report").setFontSize(20).setBold().setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("Generated on: " + LocalDateTime.now().format(dateFormatter)).setFontSize(10).setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("\n"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 3, 2, 2, 2, 3, 2, 2}));
        table.setWidth(UnitValue.createPercentValue(100));

        table.addHeaderCell(new Cell().add(new Paragraph("ID").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Vehicle Number").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Type").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Seats").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Status").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Driver").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Health").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Last Service").setBold()));

        for (Vehicle vehicle : vehicles) {
            table.addCell(String.valueOf(vehicle.getId()));
            table.addCell(vehicle.getVehicleNumber());
            table.addCell(vehicle.getType());
            table.addCell(vehicle.getSeatCount() != null ? String.valueOf(vehicle.getSeatCount()) : "N/A");
            table.addCell(vehicle.getStatus());
            table.addCell(vehicle.getDriver() != null ? vehicle.getDriver().getUsername() : "Unassigned");
            table.addCell(vehicle.getHealthScore() != null ? String.valueOf(vehicle.getHealthScore()) : "N/A");
            table.addCell(vehicle.getLastServiceDate() != null ? vehicle.getLastServiceDate().format(dateFormatter) : "N/A");
        }

        document.add(table);
        document.add(new Paragraph("\nTotal Vehicles: " + vehicles.size()).setBold());
        document.close();
        return out.toByteArray();
    }

    public byte[] generateBlockedVehiclesReportCSV() throws Exception {
        List<Vehicle> blockedVehicles = vehicleRepository.findByStatus("REJECTED");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        CSVPrinter csvPrinter = new CSVPrinter(new OutputStreamWriter(out), 
            CSVFormat.DEFAULT.builder()
                .setHeader("ID", "Vehicle Number", "Type", "Status")
                .build());

        for (Vehicle vehicle : blockedVehicles) {
            csvPrinter.printRecord(vehicle.getId(), vehicle.getVehicleNumber(), vehicle.getType(), vehicle.getStatus());
        }

        csvPrinter.flush();
        csvPrinter.close();
        return out.toByteArray();
    }

    public byte[] generateBlockedVehiclesReportPDF() throws Exception {
        List<Vehicle> blockedVehicles = vehicleRepository.findByStatus("REJECTED");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        document.add(new Paragraph("Blocked Vehicles Report").setFontSize(20).setBold().setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("Generated on: " + LocalDateTime.now().format(dateFormatter)).setFontSize(10).setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("\n"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 3, 2, 2}));
        table.setWidth(UnitValue.createPercentValue(100));

        table.addHeaderCell(new Cell().add(new Paragraph("ID").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Vehicle Number").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Type").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Status").setBold()));

        for (Vehicle vehicle : blockedVehicles) {
            table.addCell(String.valueOf(vehicle.getId()));
            table.addCell(vehicle.getVehicleNumber());
            table.addCell(vehicle.getType());
            table.addCell(vehicle.getStatus());
        }

        document.add(table);
        document.add(new Paragraph("\nTotal Blocked Vehicles: " + blockedVehicles.size()).setBold());
        document.close();
        return out.toByteArray();
    }

    public byte[] generateBlockedDriversReportCSV() throws Exception {
        List<User> blockedDrivers = userRepository.findByRoleAndVerificationStatus("DRIVER", "REJECTED");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        CSVPrinter csvPrinter = new CSVPrinter(new OutputStreamWriter(out), 
            CSVFormat.DEFAULT.builder()
                .setHeader("ID", "Username", "Email", "Mobile Number", "Aadhaar Number", "Status")
                .build());

        for (User driver : blockedDrivers) {
            csvPrinter.printRecord(
                driver.getId(),
                driver.getUsername(),
                driver.getEmail(),
                driver.getMobileNumber() != null ? driver.getMobileNumber() : "N/A",
                driver.getAadhaarNumber() != null ? driver.getAadhaarNumber() : "N/A",
                driver.getVerificationStatus()
            );
        }

        csvPrinter.flush();
        csvPrinter.close();
        return out.toByteArray();
    }

    public byte[] generateBlockedDriversReportPDF() throws Exception {
        List<User> blockedDrivers = userRepository.findByRoleAndVerificationStatus("DRIVER", "REJECTED");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        document.add(new Paragraph("Blocked Drivers Report").setFontSize(20).setBold().setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("Generated on: " + LocalDateTime.now().format(dateFormatter)).setFontSize(10).setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("\n"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 3, 4, 3, 3, 2}));
        table.setWidth(UnitValue.createPercentValue(100));

        table.addHeaderCell(new Cell().add(new Paragraph("ID").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Username").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Email").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Mobile").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Aadhaar").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Status").setBold()));

        for (User driver : blockedDrivers) {
            table.addCell(String.valueOf(driver.getId()));
            table.addCell(driver.getUsername());
            table.addCell(driver.getEmail());
            table.addCell(driver.getMobileNumber() != null ? driver.getMobileNumber() : "N/A");
            table.addCell(driver.getAadhaarNumber() != null ? driver.getAadhaarNumber() : "N/A");
            table.addCell(driver.getVerificationStatus());
        }

        document.add(table);
        document.add(new Paragraph("\nTotal Blocked Drivers: " + blockedDrivers.size()).setBold());
        document.close();
        return out.toByteArray();
    }

    public byte[] generateTripsReportCSV(String filter) throws Exception {
        List<Trip> trips = getTripsWithFilter(filter);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        CSVPrinter csvPrinter = new CSVPrinter(new OutputStreamWriter(out), 
            CSVFormat.DEFAULT.builder()
                .setHeader("ID", "Trip Date", "Vehicle", "Driver", "Status", "Pickup", "Drop", "Distance (km)", "Available Seats")
                .build());

        for (Trip trip : trips) {
            csvPrinter.printRecord(
                trip.getId(),
                trip.getTripDate() != null ? trip.getTripDate().format(dateFormatter) : "N/A",
                trip.getVehicle() != null ? trip.getVehicle().getVehicleNumber() : "N/A",
                trip.getDriver() != null ? trip.getDriver().getUsername() : "N/A",
                trip.getStatus(),
                trip.getSource() != null ? trip.getSource() : "N/A",
                trip.getDestination() != null ? trip.getDestination() : "N/A",
                trip.getTotalKm() != null ? trip.getTotalKm() : "N/A",
                trip.getAvailableSeats() != null ? trip.getAvailableSeats() : "N/A"
            );
        }

        csvPrinter.flush();
        csvPrinter.close();
        return out.toByteArray();
    }

    public byte[] generateTripsReportPDF(String filter) throws Exception {
        List<Trip> trips = getTripsWithFilter(filter);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        String title = filter.equals("ALL") ? "All Trips Report" : 
                      filter.equals("UPCOMING") ? "Upcoming Trips Report" : "Completed Trips Report";

        document.add(new Paragraph(title).setFontSize(20).setBold().setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("Generated on: " + LocalDateTime.now().format(dateFormatter)).setFontSize(10).setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("\n"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 2, 2, 2, 2, 2, 2, 1, 1}));
        table.setWidth(UnitValue.createPercentValue(100));

        table.addHeaderCell(new Cell().add(new Paragraph("ID").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Date").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Vehicle").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Driver").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Status").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Pickup").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Drop").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("KM").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Seats").setBold()));

        for (Trip trip : trips) {
            table.addCell(String.valueOf(trip.getId()));
            table.addCell(trip.getTripDate() != null ? trip.getTripDate().format(dateFormatter) : "N/A");
            table.addCell(trip.getVehicle() != null ? trip.getVehicle().getVehicleNumber() : "N/A");
            table.addCell(trip.getDriver() != null ? trip.getDriver().getUsername() : "N/A");
            table.addCell(trip.getStatus());
            table.addCell(trip.getSource() != null ? trip.getSource() : "N/A");
            table.addCell(trip.getDestination() != null ? trip.getDestination() : "N/A");
            table.addCell(trip.getTotalKm() != null ? String.valueOf(trip.getTotalKm()) : "N/A");
            table.addCell(trip.getAvailableSeats() != null ? String.valueOf(trip.getAvailableSeats()) : "N/A");
        }

        document.add(table);
        document.add(new Paragraph("\nTotal Trips: " + trips.size()).setBold());
        document.close();
        return out.toByteArray();
    }

    private List<Trip> getTripsWithFilter(String filter) {
        if (filter.equals("UPCOMING")) {
            return tripRepository.findByStatusIn(Arrays.asList("SCHEDULED", "PENDING"));
        } else if (filter.equals("COMPLETED")) {
            return tripRepository.findByStatus("COMPLETED");
        } else {
            return tripRepository.findAll();
        }
    }
}
