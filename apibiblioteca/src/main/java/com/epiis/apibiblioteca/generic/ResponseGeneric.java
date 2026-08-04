package com.epiis.apibiblioteca.generic;

import java.util.ArrayList;
import java.util.List;

public abstract class ResponseGeneric {
    private static final String TYPE_ERROR = "error";
    private static final String TYPE_SUCCESS = "success";

    private String type;
    private List<String> listMessage;

    protected ResponseGeneric() {
        this.type = TYPE_ERROR;
        this.listMessage = new ArrayList<>();
    }

    public String getType() {
        return this.type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public List<String> getListMessage() {
        if (this.listMessage == null) {
            this.listMessage = new ArrayList<>();
        }
        return this.listMessage;
    }

    public void setListMessage(List<String> listMessage) {
        this.listMessage = listMessage;
    }

    public boolean isError() {
        return TYPE_ERROR.equalsIgnoreCase(this.type);
    }

    public boolean isSuccess() {
        return TYPE_SUCCESS.equalsIgnoreCase(this.type);
    }

    public void success() {
        this.type = TYPE_SUCCESS;
    }

    public void warning() {
        this.type = "warning";
    }

    public void error() {
        this.type = TYPE_ERROR;
    }

    public void exception() {
        this.type = "exception";
    }
}
