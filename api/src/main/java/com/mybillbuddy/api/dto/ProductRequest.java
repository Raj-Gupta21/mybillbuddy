package com.mybillbuddy.api.dto;

import java.math.BigDecimal;

public class ProductRequest {
    private String name;
    private String category;
    private Integer stock;
    private BigDecimal price;
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
}
