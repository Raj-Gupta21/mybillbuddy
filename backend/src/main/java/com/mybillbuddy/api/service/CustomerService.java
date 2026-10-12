package com.mybillbuddy.api.service;

import com.mybillbuddy.api.dto.CustomerRequest;
import com.mybillbuddy.api.model.Customer;
import com.mybillbuddy.api.repository.CustomerRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository repository;

    public CustomerService(CustomerRepository repository) {
        this.repository = repository;
    }

    public List<Customer> getAllCustomers(String owner) {
        return repository.findAllByOwnerUsername(owner);
    }

    public Customer getCustomer(Long id, String owner) {
        return repository.findByIdAndOwnerUsername(id, owner)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Customer not found"
                        ));
    }

    public Customer createCustomer(CustomerRequest request, String owner) {

        Customer customer = new Customer();

        customer.setName(request.getName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        customer.setGstin(request.getGstin());
        customer.setOwnerUsername(owner);

        return repository.save(customer);
    }

    public Customer updateCustomer(
            Long id,
            CustomerRequest request, String owner) {

        Customer customer = getCustomer(id, owner);

        customer.setName(request.getName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        customer.setGstin(request.getGstin());

        return repository.save(customer);
    }

    public void deleteCustomer(Long id, String owner) {

        Customer customer = getCustomer(id, owner);

        repository.delete(customer);
    }
}
